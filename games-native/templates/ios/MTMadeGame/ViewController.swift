import UIKit
import WebKit

class ViewController: UIViewController, WKNavigationDelegate {
    var web: WKWebView!

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .black
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        web = WKWebView(frame: view.bounds, configuration: config)
        web.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        web.navigationDelegate = self
        web.scrollView.bounces = false
        web.isOpaque = false
        web.backgroundColor = .black
        view.addSubview(web)
        if let url = Bundle.main.url(forResource: "game", withExtension: "html") {
            web.loadFileURL(url, allowingReadAccessTo: url.deletingLastPathComponent())
        }
    }

    override var prefersStatusBarHidden: Bool { true }
}
