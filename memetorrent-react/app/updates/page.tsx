'use client';

function Shot({ src, alt, caption }: { src: string; alt: string; caption: string }) {
  return (
    <figure className="mt-4 mb-2">
      <img src={src} alt={alt} className="w-full rounded-2xl border border-white/10 object-cover max-h-[340px]" />
      <figcaption className="mt-2 text-[11px] text-white/40">{caption}</figcaption>
    </figure>
  );
}

export default function UpdatesPage() {
  return (
    <main className="min-h-screen bg-black text-[#eef6ff] py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="uppercase text-xs tracking-[3px] text-emerald-400 mb-2">ECOSYSTEM</div>
        <h1 className="text-4xl font-semibold tracking-[-1.5px] mb-3">Updates &amp; Changelog</h1>
        <p className="text-sm text-[#97a7c6] mb-10">
          Latest: 17 September 2026 — Driver Panda is live off this site at{' '}
          <a href="https://driver-panda.vercel.app" className="text-emerald-400 hover:underline">
            driver-panda.vercel.app
          </a>{' '}
          (this domain&apos;s <span className="font-mono text-white/80">/devs</span> sends you there). Below that, every
          public ship since the 17 August 2026 site, portal, catalog, Studio, MT Chat and vault drop.
        </p>

        <div className="space-y-12 text-sm">
          <section>
            <div className="text-[#19d37e] text-xs mb-1">17 SEPTEMBER 2026</div>
            <div className="font-medium text-lg">Driver Panda — Uber, Dasher, Hello Panda</div>
            <ul className="mt-3 space-y-1 text-[#97a7c6]">
              <li>
                • <span className="text-white/80">Driver Panda</span> launched as a standalone iPhone web app (Add to
                Home Screen in Safari). One home screen for Uber Driver, DoorDash Dasher, and Hello Panda (HungryPanda /
                DeliveryPanda courier).
              </li>
              <li>
                • Hosted off this website at{' '}
                <a href="https://driver-panda.vercel.app" className="text-emerald-400 hover:underline">
                  https://driver-panda.vercel.app
                </a>
                . <span className="font-mono text-white/80">/devs</span> on memetorrent.futuret3ch.com.au redirects
                there so the tracker is not served from this origin.
              </li>
              <li>
                • Combined today / week / month pay, trip + expense log, IRS mileage (76¢/mi from 1 Jul 2026), CSV/JSON
                export, and a stateless HTTP API (
                <span className="font-mono">/api/health</span>, <span className="font-mono">/api/v1/preview</span>,{' '}
                <span className="font-mono">/api/v1/summary</span>, <span className="font-mono">/api/v1/platforms</span>
                ).
              </li>
              <li>
                • One-tap Open app / App Store links for Uber Driver, Dasher, and DeliveryPanda. Live/offline toggles
                with a shift timer. Trip history stays on the phone.
              </li>
              <li>
                • Source:{' '}
                <a
                  href="https://github.com/Futuret3chdev/driver-panda"
                  className="text-emerald-400 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  github.com/Futuret3chdev/driver-panda
                </a>
                . Not affiliated with Uber, DoorDash, or HungryPanda — those apps have no public driver API, so this is
                a tracker and launcher, not a login into their accounts.
              </li>
            </ul>
          </section>

          <section>
            <div className="text-[#19d37e] text-xs mb-1">16 SEPTEMBER 2026</div>
            <div className="font-medium text-lg">Hive Memory Minefield</div>
            <ul className="mt-3 space-y-1 text-[#97a7c6]">
              <li>
                • Hive Memory Minefield shipped as a public arcade title. $MT coin art set to green.
              </li>
            </ul>
          </section>

          <section>
            <div className="text-[#19d37e] text-xs mb-1">15 SEPTEMBER 2026</div>
            <div className="font-medium text-lg">MT World Gallery + Dustline</div>
            <ul className="mt-3 space-y-1 text-[#97a7c6]">
              <li>
                • Gallery uses World House photo cutouts: full catalog, upload, and a plaza reset. 3D people and items
                drop into the plaza.
              </li>
              <li>
                • Dress and Furnish stay as 3D people. Picking a Dress person puts that photo-character in the plaza.
              </li>
              <li>
                • World House loads from its own origin so CSS and the 3D scene actually render. Fullscreen play layout.
                World House is the real-photo world engine; furnish opens inside Gallery.
              </li>
              <li>
                • Stand photos in Gallery as 3D reliefs, same idea as World mode.
              </li>
              <li>
                • <span className="text-white/80">Dustline</span> — first-person dusty arena with MT World operators
                (no stick figures).{' '}
                <a
                  href="https://github.com/Futuret3chdev/dustline"
                  className="text-emerald-400 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  github.com/Futuret3chdev/dustline
                </a>
              </li>
            </ul>
          </section>

          <section>
            <div className="text-[#19d37e] text-xs mb-1">14 SEPTEMBER 2026</div>
            <div className="font-medium text-lg">Glimmer Pop + Velvet Hold&apos;em</div>
            <ul className="mt-3 space-y-1 text-[#97a7c6]">
              <li>
                • <span className="text-white/80">Glimmer Pop</span> — arcade bubble shooter. Aim glass orbs, match
                three, clear the cabinet.
              </li>
              <li>
                • <span className="text-white/80">Velvet Hold&apos;em</span> — 3D Texas Hold&apos;em with CGI regulars at
                a private felt table.
              </li>
            </ul>
          </section>

          <section>
            <div className="text-[#19d37e] text-xs mb-1">11 SEPTEMBER 2026</div>
            <div className="font-medium text-lg">MT House jukebox</div>
            <ul className="mt-3 space-y-1 text-[#97a7c6]">
              <li>
                • Telegram Mini App jukebox: one queue, everyone hears the same track.
              </li>
            </ul>
          </section>

          <section>
            <div className="text-[#19d37e] text-xs mb-1">10 SEPTEMBER 2026</div>
            <div className="font-medium text-lg">MT World House + Lumina</div>
            <ul className="mt-3 space-y-1 text-[#97a7c6]">
              <li>
                • <span className="text-white/80">MT World House</span> — selfie as aviator, dress looks, place 3D
                models in an empty house.
              </li>
              <li>
                • <span className="text-white/80">Lumina</span> — cinematic 3D asset studio. Stage objects, light them,
                export PNG or GLB.
              </li>
            </ul>
          </section>

          <section>
            <div className="text-[#19d37e] text-xs mb-1">8 SEPTEMBER 2026</div>
            <div className="font-medium text-lg">Photo house mobile</div>
            <ul className="mt-3 space-y-1 text-[#97a7c6]">
              <li>
                • Fixed the mobile black screen in the photo house. The lot stays a buildable house, not a blank frame.
              </li>
            </ul>
          </section>

          <section>
            <div className="text-[#19d37e] text-xs mb-1">5 SEPTEMBER 2026</div>
            <div className="font-medium text-lg">Shield Systems</div>
            <ul className="mt-3 space-y-1 text-[#97a7c6]">
              <li>
                • Public overview of Futuret3ch Security Shield — Universal Endpoint Integrity Suite (defensive
                visibility only). Live at{' '}
                <a href="/shield" className="text-emerald-400 hover:underline">
                  /shield
                </a>
                .
              </li>
            </ul>
          </section>

          <section>
            <div className="text-[#19d37e] text-xs mb-1">3 SEPTEMBER 2026</div>
            <div className="font-medium text-lg">Studios, Maker, Android Studio, games, APIs</div>
            <ul className="mt-3 space-y-1 text-[#97a7c6]">
              <li>
                • Photography, Sound, and World 3D rebuilt as real studios. Upload auto-restores and builds the 3D
                house. Photography studio crash on house depth fixed.
              </li>
              <li>
                • Walk the photo house in first person. House sits SE of the plaza with the facade on the front wall —
                a walkable building in MT World.
              </li>
              <li>
                • MT World: CGI character cast (no stick figures), Mixamo GLB people at ~1.7m, walk cycle, chase cam
                pulled back, landscape pass. Solid character creator replaced the flaky GLB picker. Game module load
                fixed (<span className="font-mono">clone()</span> from SkeletonUtils).
              </li>
              <li>
                • Full MT Studio Suite as separate working apps. Supercharged MT Android Studio with a device lab and
                extra studios. MT Maker is a real standalone game maker (studio.js loads from /maker; click handlers
                bind).
              </li>
              <li>
                • MT Games clients for iOS, Windows, and macOS. MT Games SDK for licensed software clients. Export
                Android Studio and Xcode projects from Maker. Signed APKs from our IDE.
              </li>
              <li>
                • Shield installers: Android APK, iOS Xcode, Chrome and Firefox, plus hub install files.
              </li>
              <li>
                • Public v1 market / tracker APIs, categorized docs, MT CLI (Unix + Windows PowerShell so Windows does
                not need chmod or Node). Play SDK expanded.
              </li>
              <li>
                • Live $MT stats and homepage chart restored. Raydium pool TVL used for liquidity (not half-reserves).
              </li>
              <li>
                • Studio editor upgraded into a real level tool.
              </li>
              <li>
                • Play shell: compact chip grid instead of a grey scroller; wallets in one dropdown; Exit on the top
                bar; fullscreen catalog games. Clubpool fills the viewport like MT World (working table kept).
              </li>
              <li>
                • Game play: Racer original highway + 3-lap race + drive stick (no phone buttons). MT Jump stays on
                screen on PC. Pac-Man locked to the arcade path. Tetris grown. Puck has a real mobile path. Tap is
                fullscreen in the play shell. MTE POP unblocked in play.
              </li>
            </ul>
          </section>

          <section>
            <div className="text-[#19d37e] text-xs mb-1">2 SEPTEMBER 2026</div>
            <div className="font-medium text-lg">Metro Vice, MTE POP, Soccer Pro</div>
            <ul className="mt-3 space-y-1 text-[#97a7c6]">
              <li>• Metro Vice — open-world city. Drive, roam, cause trouble.</li>
              <li>• MTE POP — puzzle pop, MTECOSYSTEM match adventure.</li>
              <li>• Soccer Pro — FIFA-style 3D soccer with career management.</li>
            </ul>
          </section>

          <section>
            <div className="text-[#19d37e] text-xs mb-1">29 AUGUST 2026</div>
            <div className="font-medium text-lg">Shield on the public site</div>
            <ul className="mt-3 space-y-1 text-[#97a7c6]">
              <li>
                • Shield hub on this site at{' '}
                <a href="/shield" className="text-emerald-400 hover:underline">
                  /shield
                </a>
                . Product tabs with demos, illustrated help, Mac help guides, live-site copy.
              </li>
              <li>
                • Shield Business seats. Billing: PayID now; cards, Send, and other billing coming soon. 14-day trial
                login fixed. API page is labeled separately from the site API.
              </li>
              <li>
                • Public Shield URLs point at memetorrent.futuret3ch.com.au/shield. Grok watermarks removed from Shield
                images; shield-mark corner fixed after watermark removal. Footer Boards link replaced with Shield.
              </li>
            </ul>
          </section>

          <section>
            <div className="text-[#19d37e] text-xs mb-1">17 AUGUST 2026</div>
            <div className="font-medium text-lg">Public site, bar and login</div>
            <Shot
              src="/updates/bar.jpg"
              alt="Social bar cluster"
              caption="CHAT mark, BUY $MT and the full mint live on the social bar."
            />
            <ul className="mt-3 space-y-1 text-[#97a7c6]">
              <li>
                • <span className="text-white/80">Software</span> added to the public nav (same GitHub / Vercel project
                as the rest of the site).
              </li>
              <li>
                • <span className="text-white/80">Top nav</span> — Tokenomics, Utilities, TAP, Games, API, CLAIM $MT,
                Software, Contact. Soccer and P2E removed from the bar. Safety stays in the footer.
              </li>
              <li>
                • <span className="text-white/80">Social bar</span> — Discord / X / Telegram, LIVE $MT, speech-bubble +
                CHAT (not a text CHAT label), BUY $MT (where Contact used to sit), then CA + the full mint{' '}
                <span className="font-mono text-emerald-400/90 break-all">
                  ELywDcVX2WumHm4xEfqF8NdEKaeGCAaq9JmwtjE8pump
                </span>
                . Account and theme sit on this row so they no longer hang off the page.
              </li>
              <li>
                • <span className="text-white/80">Log in / Register / Log out</span> stay on the bar at all times. After
                login or register, Log out is immediate. Same on mobile.
              </li>
              <li>
                • <span className="text-white/80">/login</span> exists so botv9 and other clients stop 404ing. Chat,
                Play and Studio tools other than the public demo require sign-in. Games stay viewable.
              </li>
              <li>
                • <span className="text-white/80">Infinite Wallet</span> links only go to{' '}
                <a href="https://mt.futuret3ch.com.au" className="text-emerald-400 hover:underline">
                  mt.futuret3ch.com.au
                </a>
                .
              </li>
              <li>
                • <span className="text-white/80">Back</span> on catalog, casino, studio, software, chat and portal.
              </li>
            </ul>
          </section>

          <section>
            <div className="text-[#19d37e] text-xs mb-1">17 AUGUST 2026</div>
            <div className="font-medium text-lg">Portal, licenses and wallets</div>
            <ul className="mt-3 space-y-1 text-[#97a7c6]">
              <li>
                • Portal is back as <span className="text-white/80">Users / Developers / Businesses</span> — not a
                developer-only screen.
              </li>
              <li>
                • One login across sites. Signup/login 500s on bigint user ids fixed. Session token updates by email.
              </li>
              <li>
                • <span className="text-white/80">Free builder license</span> on first sign-in (MT Games APK + Studio).
                Key lives on the account.
              </li>
              <li>
                • <span className="text-white/80">Upgrade to Pro</span> is Coming soon — paid. You cannot flip Pro for
                free. Same on Software → Developers.
              </li>
              <li>
                • <span className="text-white/80">Profile photo</span> — upload or URL on Portal → My Portal. Attached
                to the account, not just a chat username. Shows in chat, hover cards and the 👤 slot.
              </li>
              <li>
                • Multiple wallets on the profile. Telegram, Discord and wallets hydrate from held records so empty
                rows pick up sibling data.
              </li>
              <li>
                • Settings group on the portal: Chat, Friends, Vault next to Profile / Library / Scores / Wallet.
              </li>
            </ul>
          </section>

          <section>
            <div className="text-[#19d37e] text-xs mb-1">17 AUGUST 2026</div>
            <div className="font-medium text-lg">Games catalog, P2E, casino, scores</div>
            <Shot
              src="/updates/catalog.jpg"
              alt="Game library"
              caption="Every title is cover + name + Play. Play needs a signed-in account."
            />
            <ul className="mt-3 space-y-1 text-[#97a7c6]">
              <li>
                • Real catalog with covers for botv9 titles plus Soccer Pro, MTE Pop, Metro Vice, Starfleet, Pocket,
                Gallery and the rest of the library.
              </li>
              <li>• Cards are image + name + Play — not text-only rows.</li>
              <li>
                • Third-party casino branding (Poker Stars) removed after it was not ours. Casino has back buttons.
              </li>
              <li>
                • <span className="text-white/80">Pocket</span> play points at the Clubpool client, not the Socket.IO
                health line. <span className="text-white/80">Gallery</span> play is{' '}
                <a href="https://futuret3ch.com.au/software/gallery/" className="text-emerald-400 hover:underline">
                  futuret3ch.com.au/software/gallery/
                </a>
                .
              </li>
              <li>• Pocket and Gallery (MT WORLD) are on the library and first on /p2e.</li>
              <li>• Tap Tap CSS loads (index.html + base href). Tap, Pocket and Puck scores write to the account.</li>
              <li>• Android MT Games APK ships under Software / Games behind the free license.</li>
            </ul>
          </section>

          <section>
            <div className="text-[#19d37e] text-xs mb-1">17 AUGUST 2026</div>
            <div className="font-medium text-lg">Studio — web, Windows, Mac</div>
            <Shot
              src="/updates/studio.jpg"
              alt="In-browser game studio"
              caption="Landing, SDK, publisher signup and a visual editor — not a one-page stub."
            />
            <ul className="mt-3 space-y-1 text-[#97a7c6]">
              <li>• Web Studio plus Windows launcher and macOS zip (open the URL; not a Linux Mach-O .app).</li>
              <li>• Split into landing, SDK explorer, publisher signup, visual editor (scenes, objects, events).</li>
              <li>• Mobile layout for demo, publisher and editor. Back links on every Studio route.</li>
              <li>• Demo is public. Editor / maker / play require sign-in.</li>
              <li>
                • Xsolla name and operator-directed comments stripped from live pages. Commerce TypeScript unblocked
                so Vercel can deploy.
              </li>
            </ul>
          </section>

          <section>
            <div className="text-[#19d37e] text-xs mb-1">17 AUGUST 2026</div>
            <div className="font-medium text-lg">MT Chat — rooms, DMs, host video</div>
            <Shot
              src="/updates/host-room.jpg"
              alt="Host playing a shared screen for a room"
              caption="Host Play / Stop. Everyone else only mutes. Play rewinds the room to 0:00."
            />
            <ul className="mt-3 space-y-1 text-[#97a7c6]">
              <li>• People create their own #channels. Public or private, editable any time. Invite link.</li>
              <li>
                • Public rooms list for everyone — a “public” test room that was stored as gated is public now.
              </li>
              <li>
                • <span className="text-white/80">1:1 Message</span> from a hover card, friend name or Portal →
                Friends. That is a private thread, not #trades.
              </li>
              <li>
                • Host-only room edit. Host can invite <span className="text-white/80">admins and mods</span>. Host
                can cancel a room they created (not system rooms, not vault).
              </li>
              <li>
                • Shared video: host Play starts with sound from 0:00; viewers start muted and Unmute does not
                restart; host Play restarts everyone ready for that session.
              </li>
              <li>
                • Attach photo, music, video, files (4MB). Host video becomes the room player. Live music / YouTube
                URL. Image or preset as background. Collab pad. **bold** and `code` in text.
              </li>
              <li>
                • Compact $MT sparkline (price, %, mcap) — not the Dexscreener toolbar.
              </li>
              <li>
                • Hover a name — card stays up, sits next to the name, above the composer. Add and Message on the
                card.
              </li>
              <li>
                • Delete your sent messages. Stickers. In-chat trades. NFT send. Auto-strip swearing / racism.
                Find people by username.
              </li>
              <li>• Chat is social-bar only (not a main-nav page). Requires login.</li>
            </ul>
            <Shot
              src="/updates/direct.jpg"
              alt="Private conversation aside from the public floor"
              caption="A 1:1 thread stays between you two. Public channels stay on the main floor."
            />
          </section>

          <section>
            <div className="text-[#19d37e] text-xs mb-1">17 AUGUST 2026</div>
            <div className="font-medium text-lg">Vault and friends</div>
            <Shot
              src="/updates/vault.jpg"
              alt="Personal vault"
              caption="Vault is only yours — notes and files on the same login."
            />
            <ul className="mt-3 space-y-1 text-[#97a7c6]">
              <li>
                • <span className="text-white/80">Personal vault</span> — Settings on portal and in chat. Notes, file
                locker, Save to vault from a chat attachment. Nobody else can open it. Cannot be cancelled or invited.
              </li>
              <li>
                • <span className="text-white/80">Friends</span> — Portal → Friends and the chat sidebar are the same
                list: search, Add, Remove, Message. Empty state tells you how to add someone.
              </li>
            </ul>
          </section>

          <section>
            <div className="text-[#19d37e] text-xs mb-1">17 AUGUST 2026</div>
            <div className="font-medium text-lg">Deploys that were blocking production</div>
            <ul className="mt-3 space-y-1 text-[#97a7c6]">
              <li>
                • Navbar JSX missing a wrapper — Vercel <span className="text-white/80">next build</span> exited 1.
              </li>
              <li>
                • <span className="text-white/80">vercel.json outputDirectory: .next</span> removed so Next.js is not
                treated as a static folder.
              </li>
              <li>
                • Repo-root package.json so a root-directory build still reaches memetorrent-react.
              </li>
              <li>
                • Layout imported MtTracker files that were never in git — local build passed, Vercel failed. Shipped.
              </li>
              <li>
                • npm “42 vulnerabilities” is an install warning. It does not fail next build. No forced Next bump.
              </li>
              <li>• Layout stamp so you can see which production build is live.</li>
              <li>• Test messages in #trades from the day’s user tests were wiped.</li>
            </ul>
          </section>

          <section>
            <div className="text-[#19d37e] text-xs mb-1">JULY 2026</div>
            <div className="font-medium">METAVERSE — Pet Meta World, 3D Pets &amp; Creative Tools</div>
            <ul className="mt-2 space-y-1 text-[#97a7c6]">
              <li>• Pet Meta World (METAVERSE) — shared 3D world where you explore with your pets</li>
              <li>• TripoSR pipeline — transparent PNG artwork converts to live 3D pet models in-world</li>
              <li>• Real-time multiplayer — see other players and their pets in the same world</li>
              <li>
                • Pet customization — themes (Classic, Cosmic, Forest, Cyber, Royal, Ocean), accessories (Crown, Cape,
                Shades, Wings, Scarf), and colour palettes
              </li>
              <li>• Pet video creation — AI-generated short videos of your pet, saved to your pet profile</li>
              <li>• Evolution tree — track forms and unlock new portrait stages as you level up</li>
              <li>• New transparent pet assets released (Tony #131, Baby #664) with automatic 3D model generation</li>
              <li>• Telegram hub refreshed — /com shows MT Ecosystem stats</li>
            </ul>
          </section>

          <section>
            <div className="text-[#19d37e] text-xs mb-1">JUNE 2026</div>
            <div className="font-medium">Wallet Adapter Integration &amp; Buy Panel Polish</div>
            <ul className="mt-2 space-y-1 text-[#97a7c6]">
              <li>• Added explicit mobile deeplink support for Phantom, Solflare &amp; Backpack in the buy panel</li>
              <li>• Cleaned buy panel UI — removed clutter while keeping connect options for mobile</li>
              <li>• Status page now renders live service data from public feed</li>
            </ul>
          </section>

          <section>
            <div className="text-[#19d37e] text-xs mb-1">ONGOING</div>
            <div className="font-medium">Core Infrastructure &amp; Self-Built Services</div>
            <p className="mt-2 text-[#97a7c6]">
              All services listed on the{' '}
              <a href="/status" className="text-emerald-400 hover:underline">
                Status page
              </a>{' '}
              remain fully self-hosted. Follow real-time updates on X.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-xs text-white/50">
          For the latest announcements follow{' '}
          <a href="https://x.com/MemeTorrent" target="_blank" className="text-emerald-400 hover:underline">
            @MemeTorrent
          </a>{' '}
          and{' '}
          <a href="https://x.com/futuret3chdev" target="_blank" className="text-emerald-400 hover:underline">
            @futuret3chdev
          </a>
          .
        </div>
      </div>
    </main>
  );
}
