// Same config as lucky-reels (https://github.com/Futuret3chdev/lucky-reels)
export const MEMETORRENT = {
  mtMint: 'ELywDcVX2WumHm4xEfqF8NdEKaeGCAaq9JmwtjE8pump',
  treasury: '35hMAzLD99oag1RUjBTNUoJuwqso4xvKEYsWHsvjskqD',
  rpcUrl: 'https://mainnet.helius-rpc.com/?api-key=61a3cb76-ffd8-4dde-bb49-35cae29566c8',
  decimals: 6,
  symbol: '$MEMETORRENT',
  minSolForFees: 0.002,
  jupiterBuy: 'https://jup.ag/swap/SOL-ELywDcVX2WumHm4xEfqF8NdEKaeGCAaq9JmwtjE8pump',
  jupiterSolFees: 'https://jup.ag/swap/ELywDcVX2WumHm4xEfqF8NdEKaeGCAaq9JmwtjE8pump-SOL'
};

export const LUCKY_REELS_URL = 'https://lucky-reels-eosin.vercel.app';

// OAuth — same structure & credentials as mte-pop/js/config.js (MTEPOP_CONFIG)
export const MT_POKER_CONFIG = {
  appUrl: 'https://memetorrent.futuret3ch.com.au',
  appName: 'Nova Mirage',
  inviteMessage: 'Join me at Nova Mirage — poker, pokiers & more in the MT Ecosystem!',

  // Same Discord app + redirect already registered for the MT site
  // (https://memetorrent.futuret3ch.com.au/games/api/discord-callback.php)
  googleClientId: '',
  facebookAppId: '',
  discordClientId: '1380444668562505789',
  discordRedirectUri: 'https://memetorrent.futuret3ch.com.au/games/api/discord-callback.php',
  telegramBotUsername: 'mod_futuret3ch_bot',
  telegramAuthMode: 'deeplink',
  // Token NEVER goes in this file. Set in Vercel → Environment Variables:
  //   TELEGRAM_BOT_TOKEN
  //   TELEGRAM_WEBHOOK_SECRET
  //   DISCORD_CLIENT_SECRET (optional — PKCE public client works without it)
  // Bot /start handler: scripts/mtpoker-bot-start-handler.js (mtpoker_<code>_<sig>)
  // Vercel env: TELEGRAM_BOT_TOKEN, TELEGRAM_WEBHOOK_SECRET, MT_POKER_APP_URL

  demoAuth: false
};