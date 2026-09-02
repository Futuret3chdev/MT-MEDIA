package main

import (
	"archive/zip"
	"bytes"
	"embed"
	"encoding/json"
	"io"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os/exec"
	"path"
	"runtime"
	"strings"
	"time"
)

//go:embed web templates
var bundled embed.FS

func openApp(url string) {
	switch runtime.GOOS {
	case "windows":
		if exec.Command("cmd", "/c", "start", "", "msedge", "--app="+url).Start() == nil {
			return
		}
		if exec.Command("cmd", "/c", "start", "", "chrome", "--app="+url).Start() == nil {
			return
		}
		_ = exec.Command("rundll32", "url.dll,FileProtocolHandler", url).Start()
	case "darwin":
		if exec.Command("open", "-na", "Google Chrome", "--args", "--app="+url).Start() != nil {
			_ = exec.Command("open", url).Start()
		}
	default:
		_ = exec.Command("xdg-open", url).Start()
	}
}

type exportBody struct {
	Name string `json:"name"`
	HTML string `json:"html"`
}

func zipTemplate(root, html, filename string) ([]byte, error) {
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)
	err := fs.WalkDir(bundled, root, func(p string, d fs.DirEntry, err error) error {
		if err != nil || d.IsDir() {
			return err
		}
		rel := strings.TrimPrefix(p, root+"/")
		if rel == "app/src/main/assets/index.html" || rel == "game.html" || rel == "MTMadeGame/game.html" {
			return nil
		}
		if strings.Contains(rel, "/build/") || strings.HasSuffix(rel, "local.properties") {
			return nil
		}
		f, err := bundled.Open(p)
		if err != nil {
			return err
		}
		defer f.Close()
		w, err := zw.Create(path.Join(filename, rel))
		if err != nil {
			return err
		}
		_, err = io.Copy(w, f)
		return err
	})
	if err != nil {
		zw.Close()
		return nil, err
	}
	assetName := path.Join(filename, "app/src/main/assets/index.html")
	if root == "templates/ios" {
		assetName = path.Join(filename, "MTMadeGame/game.html")
	}
	w, err := zw.Create(assetName)
	if err != nil {
		zw.Close()
		return nil, err
	}
	if _, err := io.WriteString(w, html); err != nil {
		zw.Close()
		return nil, err
	}
	if err := zw.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func slugName(s, fallback string) string {
	name := strings.Map(func(r rune) rune {
		if (r >= 'a' && r <= 'z') || (r >= 'A' && r <= 'Z') || (r >= '0' && r <= '9') || r == '-' {
			return r
		}
		return '-'
	}, s)
	if name == "" {
		return fallback
	}
	return name
}

func exportHandler(root, prefix string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "POST", 405)
			return
		}
		var body exportBody
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			http.Error(w, "bad json", 400)
			return
		}
		if body.HTML == "" {
			http.Error(w, "need html", 400)
			return
		}
		name := slugName(body.Name, prefix)
		z, err := zipTemplate(root, body.HTML, name)
		if err != nil {
			http.Error(w, err.Error(), 500)
			return
		}
		w.Header().Set("Content-Type", "application/zip")
		w.Header().Set("Content-Disposition", "attachment; filename="+name+"-"+prefix+".zip")
		_, _ = w.Write(z)
	}
}

func buildAPKHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "POST", 405)
		return
	}
	var body exportBody
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		http.Error(w, "bad json", 400)
		return
	}
	if body.HTML == "" {
		http.Error(w, "need html", 400)
		return
	}
	apk, err := buildGameAPK(body.HTML)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}
	name := slugName(body.Name, "MTGame")
	w.Header().Set("Content-Type", "application/vnd.android.package-archive")
	w.Header().Set("Content-Disposition", "attachment; filename="+name+".apk")
	_, _ = w.Write(apk)
}

func main() {
	sub, err := fs.Sub(bundled, "web")
	if err != nil {
		log.Fatal(err)
	}
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		log.Fatal(err)
	}
	mux := http.NewServeMux()
	mux.Handle("/", http.FileServer(http.FS(sub)))
	mux.HandleFunc("/build/apk", buildAPKHandler)
	mux.HandleFunc("/export/android", exportHandler("templates/android", "gradle"))
	mux.HandleFunc("/export/ios", exportHandler("templates/ios", "ios"))
	go func() { _ = http.Serve(ln, mux) }()
	url := "http://" + ln.Addr().String() + "/"
	log.Println("MT Android Studio", url)
	time.Sleep(150 * time.Millisecond)
	openApp(url)
	select {}
}
