fx_version 'cerulean'
game 'gta5'

author 'Neon'
description 'Neon loadscreen'
version '1.0.0'

escrow_ignore {
    'html/config.js'
}

loadscreen 'html/index.html'
loadscreen_cursor 'yes'

client_script 'Neon.lua'

files {
    'assets/**',
    'html/**'
}

dependency '/assetpacks'