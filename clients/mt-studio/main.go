package main

import (
	"fmt"
	"os"
	"os/exec"
	"runtime"
)

const studioURL = "https://memetorrent.futuret3ch.com.au/studio"

func main() {
	var cmd *exec.Cmd
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", studioURL)
	case "darwin":
		cmd = exec.Command("open", studioURL)
	default:
		cmd = exec.Command("xdg-open", studioURL)
	}
	if err := cmd.Start(); err != nil {
		fmt.Fprintln(os.Stderr, "Could not open MT Studio:", err)
		fmt.Println("Open this URL:", studioURL)
		os.Exit(1)
	}
}
