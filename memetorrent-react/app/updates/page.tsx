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
          What shipped on the public site, portal and MT Chat. 17 August 2026.
        </p>

        <div className="space-y-12 text-sm">
          <section>
            <div className="text-[#19d37e] text-xs mb-1">17 AUGUST 2026</div>
            <div className="font-medium text-lg">MT Chat — rooms, DMs, vault and host video</div>
            <p className="mt-2 text-[#97a7c6]">
              Chat is no longer one public floor. You can message one person, run your own rooms, pin a small $MT
              chart, and play a video that the whole room follows.
            </p>
            <Shot
              src="/updates/host-room.jpg"
              alt="Host playing a shared screen for a room"
              caption="Host Play / Stop drives the room. Everyone else can only mute or unmute."
            />
            <ul className="mt-3 space-y-1 text-[#97a7c6]">
              <li>
                • <span className="text-white/80">Direct messages</span> — Message or a friend name opens a private
                thread. It no longer dumps you into #trades.
              </li>
              <li>
                • <span className="text-white/80">Public and private rooms</span> — Create a channel, switch visibility
                any time, send an invite link. Public rooms show for everyone (not just the owner).
              </li>
              <li>
                • <span className="text-white/80">Host controls</span> — Only the host edits the room. Hosts can add
                admins and mods. Host Play starts everyone at 0:00. Viewers unmute without restarting.
              </li>
              <li>
                • <span className="text-white/80">Attachments</span> — Photo, music, video and files in the composer.
                A host video becomes the shared room player.
              </li>
              <li>
                • <span className="text-white/80">Room settings</span> — Background (including an uploaded photo),
                live music / YouTube, collab pad, compact $MT sparkline. Cancel a room you created.
              </li>
              <li>
                • <span className="text-white/80">Hover cards</span> — Stay open so you can Add or Message. They sit
                next to the name, above the composer.
              </li>
            </ul>
            <Shot
              src="/updates/direct.jpg"
              alt="Private conversation aside from the public floor"
              caption="A 1:1 thread stays between you two. Public channels stay on the main floor."
            />
          </section>

          <section>
            <div className="text-[#19d37e] text-xs mb-1">17 AUGUST 2026</div>
            <div className="font-medium text-lg">Vault, friends and settings</div>
            <Shot
              src="/updates/vault.jpg"
              alt="Personal vault"
              caption="Vault is only yours — notes and files on the same login."
            />
            <ul className="mt-3 space-y-1 text-[#97a7c6]">
              <li>
                • <span className="text-white/80">Settings</span> — Portal left nav groups Chat, Friends and Vault
                under Settings. Same idea in the chat sidebar.
              </li>
              <li>
                • <span className="text-white/80">Friends</span> — Search, Add, Remove. Hover a name in chat and tap
                Add. Portal → Friends is the same list.
              </li>
              <li>
                • <span className="text-white/80">Personal vault</span> — Only you. Notes, files, Save to vault from
                a chat attachment. Not a public room and cannot be invited.
              </li>
              <li>
                • <span className="text-white/80">Profile photo</span> — Upload or URL on Portal → My Portal. It
                follows the account in chat, hover cards and the bar.
              </li>
            </ul>
          </section>

          <section>
            <div className="text-[#19d37e] text-xs mb-1">17 AUGUST 2026</div>
            <div className="font-medium text-lg">Site bar, login and Software</div>
            <Shot
              src="/updates/bar.jpg"
              alt="Social bar cluster"
              caption="Chat mark, BUY $MT and the full mint stay on the social bar."
            />
            <ul className="mt-3 space-y-1 text-[#97a7c6]">
              <li>
                • <span className="text-white/80">Top nav</span> — Tokenomics, Utilities, TAP, Games, API, CLAIM $MT,
                Software, Contact.
              </li>
              <li>
                • <span className="text-white/80">Social bar</span> — Discord / X / Telegram, LIVE $MT, speech-bubble +
                CHAT, BUY $MT, then CA + the full mint{' '}
                <span className="font-mono text-emerald-400/90">
                  ELywDcVX2WumHm4xEfqF8NdEKaeGCAaq9JmwtjE8pump
                </span>
                . No more clipped ELyw…9Jmw.
              </li>
              <li>
                • <span className="text-white/80">Log in / Register / Log out</span> — Always on the bar. After you
                finish login or register, Log out is right there. Same on mobile.
              </li>
              <li>
                • <span className="text-white/80">Software / Developers</span> — Free builder key on first sign-in.
                Upgrade to Pro is Coming soon — paid. You cannot flip Pro for free.
              </li>
            </ul>
          </section>

          <section>
            <div className="text-[#19d37e] text-xs mb-1">17 AUGUST 2026</div>
            <div className="font-medium text-lg">Fixes that were blocking the live site</div>
            <ul className="mt-3 space-y-1 text-[#97a7c6]">
              <li>
                • <span className="text-white/80">next build</span> — Layout imported a tracker file that was never in
                git. Vercel failed; local build passed. Those files are on main now.
              </li>
              <li>
                • <span className="text-white/80">npm audit</span> — The 42-vulnerability list is an install warning.
                It does not fail the deploy. No forced Next bump.
              </li>
              <li>
                • <span className="text-white/80">Public rooms</span> — A “public” test room had been stored as gated,
                so a second account could not see it. Public means public.
              </li>
              <li>
                • <span className="text-white/80">Pinned $MT chart</span> — Compact sparkline (price, %, mcap). The
                oversized Dexscreener toolbar is gone.
              </li>
              <li>
                • <span className="text-white/80">Test chat</span> — t3xx test messages in #trades were wiped.
              </li>
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
