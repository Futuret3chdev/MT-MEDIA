package main

import (
	"archive/zip"
	"bytes"
	"crypto"
	"crypto/x509"
	"encoding/pem"
	"fmt"
	"io"
	"strings"

	"github.com/agusibrahim/apksig-go/pkg/algo"
	"github.com/agusibrahim/apksig-go/pkg/apkwriter"
	"github.com/agusibrahim/apksig-go/pkg/datasource"
	"github.com/agusibrahim/apksig-go/pkg/signer"
)

func parsePrivateKey(pemBytes []byte) (crypto.PrivateKey, error) {
	block, _ := pem.Decode(pemBytes)
	if block == nil {
		return nil, fmt.Errorf("no PEM key")
	}
	if k, err := x509.ParsePKCS8PrivateKey(block.Bytes); err == nil {
		return k, nil
	}
	if k, err := x509.ParsePKCS1PrivateKey(block.Bytes); err == nil {
		return k, nil
	}
	return nil, fmt.Errorf("unsupported private key")
}

func parseCert(pemBytes []byte) (*x509.Certificate, error) {
	block, _ := pem.Decode(pemBytes)
	if block == nil {
		return nil, fmt.Errorf("no PEM cert")
	}
	return x509.ParseCertificate(block.Bytes)
}

func replaceZipFile(apk []byte, name string, body []byte) ([]byte, error) {
	r, err := zip.NewReader(bytes.NewReader(apk), int64(len(apk)))
	if err != nil {
		return nil, err
	}
	var buf bytes.Buffer
	zw := zip.NewWriter(&buf)
	for _, f := range r.File {
		if f.Name == name {
			continue
		}
		if strings.HasPrefix(f.Name, "META-INF/") {
			base := f.Name[len("META-INF/"):]
			if strings.HasSuffix(base, ".SF") || strings.HasSuffix(base, ".RSA") || strings.HasSuffix(base, ".DSA") || strings.HasSuffix(base, ".EC") || base == "MANIFEST.MF" {
				continue
			}
		}
		rc, err := f.Open()
		if err != nil {
			zw.Close()
			return nil, err
		}
		hdr := f.FileHeader
		w, err := zw.CreateHeader(&hdr)
		if err != nil {
			rc.Close()
			zw.Close()
			return nil, err
		}
		_, err = io.Copy(w, rc)
		rc.Close()
		if err != nil {
			zw.Close()
			return nil, err
		}
	}
	h := &zip.FileHeader{Name: name, Method: zip.Deflate}
	w, err := zw.CreateHeader(h)
	if err != nil {
		zw.Close()
		return nil, err
	}
	if _, err := w.Write(body); err != nil {
		zw.Close()
		return nil, err
	}
	if err := zw.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func signAPK(unsigned []byte, keyPEM, certPEM []byte) ([]byte, error) {
	priv, err := parsePrivateKey(keyPEM)
	if err != nil {
		return nil, err
	}
	cert, err := parseCert(certPEM)
	if err != nil {
		return nil, err
	}
	alg, err := algo.PickAlgorithm(priv)
	if err != nil {
		return nil, err
	}
	cfg := &signer.SignerConfig{
		PrivateKey: priv,
		Certs:      []*x509.Certificate{cert},
		Algorithms: []algo.Algorithm{alg},
	}
	var out bytes.Buffer
	w := &apkwriter.SignedAPKWriter{
		Src:      datasource.NewBytes(unsigned),
		Signers:  []*signer.SignerConfig{cfg},
		V3MinSdk: 28,
		V3MaxSdk: 0x7fffffff,
		Align:    true,
	}
	if err := w.Write(&out); err != nil {
		return nil, err
	}
	return out.Bytes(), nil
}

func buildGameAPK(html string) ([]byte, error) {
	shell, err := bundled.ReadFile("templates/shell/game-shell.apk")
	if err != nil {
		return nil, err
	}
	keyPEM, err := bundled.ReadFile("templates/shell/key.pem")
	if err != nil {
		return nil, err
	}
	certPEM, err := bundled.ReadFile("templates/shell/cert.pem")
	if err != nil {
		return nil, err
	}
	unsigned, err := replaceZipFile(shell, "assets/index.html", []byte(html))
	if err != nil {
		return nil, err
	}
	return signAPK(unsigned, keyPEM, certPEM)
}
