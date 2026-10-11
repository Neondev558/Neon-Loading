const Config = {

    branding: {
        title: 'Neon Store',
    },

    useVideoBackground: false,
    videoFile: 'freestockvideo.mp4',

    playlist: [
        {
            name: 'Uyumadan önce',
            artist: 'WEGH',
            file: 'music.mp3',
            cover: 'https://images.genius.com/058e590a99cef71f7adf13c3b32a09ef.1000x1000x1.png'
        },
    ],
    volume: 30,

    slideInterval: 5000,
    imageFiles: ['1.jpg', '2.jpg', '3.jpg', '4.jpg', '5.jpg', '6.jpg', '7.jpg', '8.jpg', '9.jpg', '10.jpg', '11.jpg'],

    team: {
        active: true,
        title: 'Ekip',
        subtitle: 'Sunucuyu ayakta tutan kadro',
        perPage: 5,
        pageInterval: 8000,
        members: [
            { name: 'Back', role: 'Developer', color: '#7dffb0', image: 'https://cdn.discordapp.com/attachments/1351234185964163167/1558850967980478534/hvwpwmr.jpeg?ex=6accf098&is=6acb9f18&hm=6a0d9c56b2f2f1037388eb0aada17a68683f93039f70f7df6c636a6b3529f18d&' },
            { name: 'Venus', role: 'Developer', color: '#7dffb0', image: 'https://cdn.discordapp.com/avatars/1200695358083317761/745b04baf60776ddf55f9270180112d7.webp?size=1024' },
            { name: 'Odin', role: 'Developer', color: '#7dffb0', image: 'https://cdn.discordapp.com/avatars/826091076237525013/be1e250ab878b04bd6ff598be7a4998e.webp?size=1024' },
        ],
    },

    tipInterval: 6000,
    tips: [
        'Rol dışı konuşmalar için OOC kanalını kullan, rolü bozma.',
        'Karakterinin hayatı tek, ona göre davran.',
        'Sorun yaşarsan oyun içinden rapor aç, ekip en kısa sürede ilgilenir.',
        'Kuralları okumadan şehre adım atma.',
    ],

    loadingTexts: {
        INIT_CORE: 'Çekirdek hazırlanıyor',
        INIT_BEFORE_MAP_LOADED: 'Oyun verileri hazırlanıyor',
        MAP: 'Harita yükleniyor',
        INIT_AFTER_MAP_LOADED: 'Şehir kuruluyor',
        INIT_SESSION: 'Oturum başlatılıyor',
        DONE: 'Şehre giriş yapılıyor',
    },

};
