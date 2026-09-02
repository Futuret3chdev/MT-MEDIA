package main

import (
	"os"
	"os/exec"
	"runtime"
)

const hub = "https://memetorrent.futuret3ch.com.au/software/games"

func main() {
	var err error
	switch runtime.GOOS {
	case "windows":
		err = exec.Command("cmd", "/c", "start", "", "msedge", "--app="+hub).Start()
		if err != nil {
			err = exec.Command("cmd", "/c", "start", "", "chrome", "--app="+hub).Start()
		}
		if err != nil {
			_ = exec.Command("rundll32", "url.dll,FileProtocolHandler", hub).Start()
		}
	case "darwin":
		err = exec.Command("open", "-na", "Google Chrome", "--args", "--app="+hub).Start()
		if err != nil {
			_ = exec.Command("open", hub).Start()
		}
	default:
		_ = exec.Command("xdg-open", hub).Start()
	}
	os.Exit(0)
}
