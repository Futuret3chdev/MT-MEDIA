package main

import (
	"embed"
	"io/fs"
	"log"
	"net"
	"net/http"
	"os/exec"
	"runtime"
	"time"
)

//go:embed all:web
var web embed.FS

func openApp(url string) {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("cmd", "/c", "start", "", "msedge", "--app="+url)
		if err := cmd.Start(); err == nil {
			return
		}
		cmd = exec.Command("cmd", "/c", "start", "", "chrome", "--app="+url)
		if err := cmd.Start(); err == nil {
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

func main() {
	sub, err := fs.Sub(web, "web")
	if err != nil {
		log.Fatal(err)
	}
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		log.Fatal(err)
	}
	mux := http.NewServeMux()
	mux.Handle("/", http.FileServer(http.FS(sub)))
	go func() { _ = http.Serve(ln, mux) }()
	url := "http://" + ln.Addr().String() + "/"
	time.Sleep(150 * time.Millisecond)
	openApp(url)
	select {}
}
