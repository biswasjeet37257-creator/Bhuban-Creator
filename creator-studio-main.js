// Creator Studio Main JavaScript
// Provides loadCreatorProfile(), loadDashboardData(), loadUserVideos(), displayRecentVideos()
// These functions are called by the initializeApp() in index.html
console.log('🎬 Creator Studio Main JS Loaded');

// Helper to bypass Google photo rate limits (429 errors) and CORB
function getSafePhotoUrl(url) {
    if (!url || url === 'null' || url === 'undefined') return null;

    // If it's a Google photo or already proxied through our old broken proxy, route it through weserv.nl
    if (url.includes('googleusercontent.com') || url.includes('lh3.google.com') || url.includes('focus-opensocial')) {
        return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&default=letter&l=9&af`;
    }
    return url;
}


// Load Creator Profile
function loadCreatorProfile() {
    console.log('👤 Loading creator profile...');

    if (!AuthService.isAuthenticated()) {
        console.log('⚠️ Not authenticated - redirecting to login');
        // Redirect to login page with absolute path
        const loginUrl = window.location.origin + '/Bhuban%20video%20stream%20app/login.html?redirect=' + encodeURIComponent(window.location.href);
        window.location.href = loginUrl;
        return;
    }

    const user = AuthService.getUser();
    console.log('✅ Current user:', user);

    if (user) {
        // Update user avatar
        const avatar = document.getElementById('userAvatar');
        if (avatar) {
            const avatarUrl = getSafePhotoUrl(user.avatar || user.picture);
            const initial = user.name ? user.name.charAt(0).toUpperCase() : 'B';

            if (avatarUrl) {
                avatar.innerHTML = `<img src="${avatarUrl}" referrerpolicy="no-referrer" style="width:100%;height:100%;object-fit:cover;border-radius:12px;" onerror="this.onerror=null; this.style.display='none'; this.parentElement.textContent='${initial}';">`;
            } else {
                avatar.textContent = initial;
            }
        }

        // Update user name
        const userName = document.getElementById('userName');
        if (userName) {
            userName.textContent = user.name || 'Bhuban Official';
        }

        // Update subscriber count
        const userSubs = document.getElementById('userStatus');
        if (userSubs) {
            userSubs.textContent = `${user.subscribers || 0} Subscribers`;
        }
    }
}

// Load Dashboard Data
async function loadDashboardData() {
    console.log('📊 Loading dashboard data...');

    if (!AuthService.isAuthenticated()) {
        console.log('⚠️ No session, showing empty state');
        return;
    }

    try {
        const session = AuthService.getSessionData();
        const userId = session.user.id || session.user._id;
        const token = session.token;

        console.log('👤 User ID:', userId);

        // Fetch user's videos using the global CONFIG
        const videosResponse = await fetch(`${BHUBAN_CONFIG.api.videos}?user=${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!videosResponse.ok) {
            throw new Error('Failed to fetch videos');
        }

        const videosData = await videosResponse.json();
        console.log('📹 Videos data:', videosData);

        if (videosData.success && videosData.data) {
            const videos = videosData.data;

            // Calculate real stats
            const totalViews = videos.reduce((sum, v) => sum + (v.views || 0), 0);
            const totalLikes = videos.reduce((sum, v) => sum + (v.likes || 0), 0);

            console.log('📊 Stats calculated:', { totalViews, totalLikes, videoCount: videos.length });

            // Update dashboard metrics
            updateMetric('viewCount', totalViews.toLocaleString());
            updateMetric('subCount', (session.user.subscribers || 0).toLocaleString());
            updateMetric('revenueAmount', '$0.00'); // Real revenue would come from monetization API

            // Show recent videos in dashboard
            displayRecentVideos(videos.slice(0, 5));
        }
    } catch (error) {
        console.error('❌ Error loading dashboard:', error);
    }
}

// Update Metric Helper
function updateMetric(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
        console.log(`  ✓ Updated ${id}: ${value}`);
    } else {
        console.warn(`  ⚠️ Element not found: ${id}`);
    }
}

// Display Recent Videos in Dashboard
function displayRecentVideos(videos) {
    // Fallback thumbnail (data URI - always works offline)
    const FALLBACK_THUMBNAIL = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%2268%22%3E%3Crect fill=%22%23222%22 width=%22120%22 height=%2268%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2212%22%3ENo Thumbnail%3C/text%3E%3C/svg%3E';

    const container = document.getElementById('videoList');
    if (!container) {
        console.warn('⚠️ Video list container not found');
        return;
    }

    if (videos.length === 0) {
        container.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-muted);">No videos yet</div>';
        return;
    }

    container.innerHTML = videos.map(video => {
        // Ensure thumbnail URL is valid
        const thumbnailUrl = getSafePhotoUrl(video.thumbnailUrl || video.thumbnail || FALLBACK_THUMBNAIL);

        return `
        <div class="video-row" style="display: flex; gap: 12px; padding: 12px; border-bottom: 1px solid rgba(255,255,255,0.05); align-items: center;">
            <img src="${thumbnailUrl}" 
                 style="width: 120px; height: 68px; border-radius: 6px; object-fit: cover;"
                 crossorigin="anonymous"
                 onerror="this.onerror=null; this.src='${FALLBACK_THUMBNAIL}'">
            <div style="flex: 1;">
                <div style="font-weight: 600; margin-bottom: 4px;">${video.title}</div>
                <div style="font-size: 12px; color: var(--text-muted);">
                    ${video.views || 0} views • ${new Date(video.createdAt).toLocaleDateString()}
                </div>
            </div>
            <div style="text-align: center; min-width: 80px;">
                <span style="padding: 4px 12px; background: rgba(16, 185, 129, 0.2); color: #10b981; border-radius: 12px; font-size: 12px; font-weight: 600;">
                    ${video.status || 'public'}
                </span>
            </div>
            <div style="text-align: center; min-width: 80px; color: var(--text-secondary);">
                ${video.views || 0}
            </div>
        </div>
        `;
    }).join('');
}

// Load User Videos for Content Page
async function loadUserVideos() {
    // Fallback thumbnail (data URI - always works offline)
    const FALLBACK_THUMBNAIL = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22120%22 height=%2268%22%3E%3Crect fill=%22%23222%22 width=%22120%22 height=%2268%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 fill=%22%23666%22 font-size=%2212%22%3ENo Thumbnail%3C/text%3E%3C/svg%3E';

    console.log('📹 Loading user videos for content page...');

    const container = document.getElementById('fullVideoList');
    const dashboardContainer = document.getElementById('videoList');
    if (!container) {
        console.error('❌ Video list container not found');
        return;
    }

    if (!AuthService.isAuthenticated()) {
        console.log('⚠️ Not authenticated - redirecting to login');
        const loginUrl = window.location.origin + '/Bhuban%20video%20stream%20app/login.html?redirect=' + encodeURIComponent(window.location.href);
        window.location.href = loginUrl;
        return;
    }

    // Show loading state
    container.innerHTML = '<div style="padding: 40px; text-align: center; color: var(--text-muted);"><i class="fas fa-spinner fa-spin"></i> Loading videos...</div>';

    try {
        const session = AuthService.getSessionData();
        const userId = session.user.id || session.user._id;
        const token = session.token;

        console.log('👤 Fetching videos for user:', userId);

        // Fetch user's videos using the global CONFIG
        const videosResponse = await fetch(`${BHUBAN_CONFIG.api.videos}?user=${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!videosResponse.ok) {
            throw new Error('Failed to fetch videos');
        }

        const videosData = await videosResponse.json();
        console.log('✅ Videos loaded:', videosData);

        let videos = [];
        if (videosData.success && videosData.data && videosData.data.length > 0) {
            videos = videosData.data;
        } else {
            // If user has no videos, try fetching all videos as fallback
            console.log('⚠️ No user videos found, fetching all videos...');
            try {
                const allVideosResponse = await fetch(`${BHUBAN_CONFIG.api.videos}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (allVideosResponse.ok) {
                    const allVideosData = await allVideosResponse.json();
                    if (allVideosData.success && allVideosData.data && allVideosData.data.length > 0) {
                        videos = allVideosData.data;
                        console.log('✅ Showing all videos:', videos.length);
                    }
                }
            } catch (e) {
                console.error('Failed to fetch all videos:', e);
            }
        }

        if (videos.length > 0) {
            // Display videos in table format with delete buttons
            const videosHtml = videos.map(video => {
                // Ensure thumbnail URL is valid
                const thumbnailUrl = getSafePhotoUrl(video.thumbnailUrl || video.thumbnail || FALLBACK_THUMBNAIL);

                return `
                <div class="video-row" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr 120px; gap: 16px; padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); align-items: center;">
                    <div style="display: flex; gap: 12px; align-items: center;">
                        <img src="${thumbnailUrl}" 
                             style="width: 120px; height: 68px; border-radius: 6px; object-fit: cover;"
                             crossorigin="anonymous"
                             onerror="this.onerror=null; this.src='${FALLBACK_THUMBNAIL}'">
                        <div>
                            <div style="font-weight: 600; margin-bottom: 4px;">${video.title}</div>
                            <div style="font-size: 12px; color: var(--text-muted);">${video.description || 'No description'}</div>
                        </div>
                    </div>
                    <div style="text-align: center;">
                        <span style="padding: 4px 12px; background: rgba(16, 185, 129, 0.2); color: #10b981; border-radius: 12px; font-size: 12px; font-weight: 600;">
                            ${video.status || 'public'}
                        </span>
                    </div>
                    <div style="text-align: center; color: var(--text-secondary);">
                        ${new Date(video.createdAt).toLocaleDateString()}
                    </div>
                    <div style="text-align: center; color: var(--text-secondary);">
                        ${video.views || 0}
                    </div>
                    <div style="text-align: center; color: var(--text-secondary);">
                        ${video.comments || 0}
                    </div>
                    <div style="display: flex; gap: 8px; justify-content: center;">
                        <button onclick="editVideo('${video._id}')" 
                                style="padding: 8px 12px; background: rgba(59, 130, 246, 0.2); color: #3b82f6; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;"
                                title="Edit video">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteVideo('${video._id}', '${video.title.replace(/'/g, "\\'")}')" 
                                style="padding: 8px 12px; background: rgba(239, 68, 68, 0.2); color: #ef4444; border: none; border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;"
                                title="Delete video">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                `;
            }).join('');

            container.innerHTML = videosHtml;

            if (dashboardContainer) {
                const dashboardHtml = videos.slice(0, 5).map(video => {
                    const thumbnailUrl = getSafePhotoUrl(video.thumbnailUrl || video.thumbnail || FALLBACK_THUMBNAIL);
                    const thumbnailStyle = video.isShort 
                        ? 'width: 45px; height: 80px; border-radius: 4px; object-fit: cover;' 
                        : 'width: 80px; height: 45px; border-radius: 4px; object-fit: cover;';
                    
                    return `
                    <div class="video-row" data-video-data='${JSON.stringify({isShort: video.isShort || false})}' style="display: grid; grid-template-columns: 32px 2.5fr 1fr 1fr 1fr; gap: 16px; padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.05); align-items: center;">
                        <div class="custom-checkbox" onclick="this.classList.toggle('checked')"></div>
                        <div style="display: flex; gap: 12px; align-items: center;">
                            <img class="video-thumbnail" src="${thumbnailUrl}" style="${thumbnailStyle}" crossorigin="anonymous" onerror="this.onerror=null; this.src='${FALLBACK_THUMBNAIL}'">
                            <div>
                                <div style="font-weight: 600; font-size: 13px; margin-bottom: 2px;">
                                    ${video.isShort ? '<i class="fas fa-bolt" style="color: #ffd60a; margin-right: 4px;"></i>' : ''}
                                    ${video.title}
                                </div>
                                <div style="font-size: 11px; color: var(--text-muted);">${new Date(video.createdAt).toLocaleDateString()}</div>
                            </div>
                        </div>
                        <div style="text-align: center;"><i class="fas fa-eye" style="color: #10b981; margin-right: 4px;"></i> Public</div>
                        <div style="text-align: center;">${video.views || 0}</div>
                        <div style="text-align: center;">$0.00</div>
                    </div>
                    `;
                }).join('');
                dashboardContainer.innerHTML = dashboardHtml;
            }

        } else {
            container.innerHTML = `
                <div style="padding: 60px 20px; text-align: center;">
                    <i class="fas fa-video" style="font-size: 64px; color: var(--text-muted); opacity: 0.3; margin-bottom: 20px;"></i>
                    <h3 style="color: var(--text-secondary); margin-bottom: 12px;">No videos yet</h3>
                    <p style="color: var(--text-muted); margin-bottom: 24px;">Upload your first video to get started!</p>
                    <a href="../Bhuban video stream app/upload.html" style="display: inline-block; padding: 12px 24px; background: var(--accent-gradient); color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                        <i class="fas fa-upload"></i> Upload Video
                    </a>
                </div>
            `;
            if (dashboardContainer) dashboardContainer.innerHTML = '';
        }
    } catch (error) {
        console.error('❌ Error loading videos:', error);
        container.innerHTML = `
            <div style="padding: 40px; text-align: center; color: var(--error);">
                <i class="fas fa-exclamation-triangle"></i> Error loading videos: ${error.message}
            </div>
        `;
    }
}

// ==========================================
// Load Creator Analytics (real data, no fake thumbnails)
// ==========================================
async function loadCreatorAnalytics() {
    console.log('📊 Loading creator analytics...');

    const THUMB_PLACEHOLDER = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='60'%3E%3Crect fill='%23252525' width='100' height='60' rx='6'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' fill='%23555' font-size='11' font-family='sans-serif'%3ENo Thumb%3C/text%3E%3C/svg%3E`;

    if (!AuthService.isAuthenticated()) return;

    try {
        const session = AuthService.getSessionData();
        const userId = session.user.id || session.user._id;
        const token = session.token;

        const res = await fetch(`${BHUBAN_CONFIG.api.videos}?user=${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to fetch');

        const data = await res.json();
        if (!data.success || !data.data) return;

        const videos = data.data;
        // Sort by views descending
        const sorted = [...videos].sort((a, b) => (b.views || 0) - (a.views || 0));
        const maxViews = sorted[0]?.views || 1;

        // Helper: safe thumbnail (no cross-origin issues)
        function safethumb(video, w, h) {
            const url = video.thumbnailUrl || video.thumbnail;
            if (!url || url === 'null' || url === 'undefined') return THUMB_PLACEHOLDER;
            // Use weserv as a CORS-safe proxy for remote images
            if (url.startsWith('http')) return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=${w}&h=${h}&fit=cover&output=webp`;
            return url;
        }

        // --- Top Content List ---
        const topContentList = document.getElementById('topContentList');
        if (topContentList) {
            if (sorted.length === 0) {
                topContentList.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">No videos yet</div>';
            } else {
                topContentList.innerHTML = sorted.slice(0, 5).map(v => `
                    <div class="popular-video-item">
                        <img src="${safethumb(v, 100, 60)}" class="pop-video-thumb"
                             onerror="this.onerror=null;this.src='${THUMB_PLACEHOLDER}'">
                        <div class="pop-video-info">
                            <div class="pop-video-title">${v.title || 'Untitled'}</div>
                            <div style="font-size:11px;color:var(--text-muted);">${new Date(v.createdAt).toLocaleDateString()}</div>
                        </div>
                        <div style="font-size:14px;font-weight:600;">${(v.views || 0).toLocaleString()} views</div>
                    </div>
                `).join('');
            }
        }

        // --- Realtime Content List ---
        const realtimeList = document.getElementById('realtimeContentList');
        if (realtimeList) {
            if (sorted.length === 0) {
                realtimeList.innerHTML = '<div style="padding:12px;text-align:center;color:var(--text-muted);font-size:12px;">No videos yet</div>';
            } else {
                realtimeList.innerHTML = sorted.slice(0, 3).map(v => `
                    <div class="realtime-content-item">
                        <img src="${safethumb(v, 50, 30)}" class="realtime-thumb"
                             onerror="this.onerror=null;this.src='${THUMB_PLACEHOLDER}'">
                        <div class="realtime-info">
                            <div class="realtime-title">${v.title || 'Untitled'}</div>
                            <div class="realtime-count">${(v.views || 0).toLocaleString()} views</div>
                        </div>
                    </div>
                `).join('');
            }
        }

        // --- Popular Videos List ---
        const popularList = document.getElementById('popularVideosList');
        if (popularList) {
            if (sorted.length === 0) {
                popularList.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;">No videos yet</div>';
            } else {
                popularList.innerHTML = sorted.slice(0, 5).map(v => {
                    const pct = maxViews > 0 ? Math.round(((v.views || 0) / maxViews) * 100) : 0;
                    return `
                        <div class="popular-video-item">
                            <img src="${safethumb(v, 100, 60)}" class="pop-video-thumb"
                                 onerror="this.onerror=null;this.src='${THUMB_PLACEHOLDER}'">
                            <div class="pop-video-info">
                                <div class="pop-video-title">${v.title || 'Untitled'}</div>
                                <div class="pop-video-bar">
                                    <div class="pop-video-fill" style="width:${pct}%;"></div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }

        // Update realtime views count with actual total
        const realtimeViews = document.querySelector('.realtime-views');
        if (realtimeViews) {
            const totalViews = videos.reduce((s, v) => s + (v.views || 0), 0);
            realtimeViews.textContent = totalViews.toLocaleString();
        }

        console.log('✅ Analytics loaded with', sorted.length, 'videos');

    } catch (err) {
        console.error('❌ Error loading analytics:', err);
    }
}

console.log('🔄 Setting up auto-refresh system...');

// Prevent multiple rapid refreshes by tracking last refresh time
let lastRefreshTime = 0;
const REFRESH_DEBOUNCE_MS = 2000; // 2 seconds debounce

function debouncedRefresh(refreshFunction) {
    const now = Date.now();
    if (now - lastRefreshTime > REFRESH_DEBOUNCE_MS) {
        lastRefreshTime = now;
        if (typeof refreshFunction === 'function') {
            refreshFunction();
        }
    } else {
        console.log('⏰ Skipping refresh - too soon since last refresh');
    }
}

// Listen for video upload events from other tabs
window.addEventListener('storage', (e) => {
    if (e.key === 'videoUploaded' || e.key === 'forceRefresh' || e.key === 'videoDeleted') {
        console.log('🔄 Storage event detected - reloading Creator Studio...');
        debouncedRefresh(loadUserVideos);
        debouncedRefresh(loadDashboardData);
    }
});

// Reload when window gains focus with debounce
window.addEventListener('focus', () => {
    console.log('🔄 Window focused - reloading Creator Studio...');
    debouncedRefresh(loadUserVideos);
    debouncedRefresh(loadDashboardData);
});

// Auto-refresh every 60 seconds (instead of 30 to reduce frequency)
setInterval(() => {
    console.log('🔄 Auto-refresh: Checking for new videos in Creator Studio...');
    debouncedRefresh(loadUserVideos);
    debouncedRefresh(loadDashboardData);
}, 60000); // Increased from 30 seconds to 60 seconds

console.log('✅ Auto-refresh system active');


// Edit Video Function
async function editVideo(videoId) {
    console.log('✏️ Edit video:', videoId);

    try {
        // Use the global api service to ensure consistent authentication
        const videoData = await api.getVideo(videoId);

        if (!videoData.success || !videoData.data) {
            throw new Error('Video not found or invalid data');
        }

        const video = videoData.data;

        // Open the edit modal and populate it with video data
        openEditVideoModal(video);

    } catch (error) {
        console.error('❌ Error loading video for edit:', error);
        alert('❌ Error loading video for editing: ' + error.message);
    }
}

// Open Edit Video Modal
function openEditVideoModal(video) {
    console.log('📝 Opening edit modal for video:', video);

    // Store current video data globally for thumbnail functions
    window.currentEditingVideo = video;

    // Populate the modal with video data
    const editVideoId = document.getElementById('editVideoId');
    const editVideoTitle = document.getElementById('editVideoTitle');
    const editVideoDesc = document.getElementById('editVideoDesc');
    const editVideoVisibility = document.getElementById('editVideoVisibility');
    const editVideoCategory = document.getElementById('editVideoCategory');

    if (editVideoId) editVideoId.value = video._id;
    if (editVideoTitle) editVideoTitle.value = video.title || '';
    if (editVideoDesc) editVideoDesc.value = video.description || '';
    if (editVideoVisibility) editVideoVisibility.value = video.visibility || video.status || 'public';
    if (editVideoCategory) editVideoCategory.value = video.category || 'other';

    // Update character counts
    if (typeof updateEditCharCount === 'function') {
        updateEditCharCount('editVideoTitle', 'editTitleCount', 100);
        updateEditCharCount('editVideoDesc', 'editDescCount', 5000);
    }

    // Set thumbnail preview
    const thumbUrl = video.thumbnailUrl || video.thumbnail || '';
    const thumbPreview = document.getElementById('editThumbnailPreview');
    if (thumbPreview) {
        if (thumbUrl && thumbUrl !== 'undefined' && thumbUrl !== 'null') {
            const safeUrl = getSafePhotoUrl(thumbUrl);
            thumbPreview.innerHTML = `<img src="${safeUrl}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.parentElement.innerHTML='<i class=\\'fas fa-image\\' style=\\'font-size: 32px; color: var(--text-muted); opacity: 0.3;\\'></i>'">`;
        } else {
            thumbPreview.innerHTML = '<i class="fas fa-image" style="font-size: 32px; color: var(--text-muted); opacity: 0.3;"></i>';
        }
    }

    // Show the modal
    const modal = document.getElementById('editVideoModal');
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        console.log('✅ Edit modal opened successfully');
    } else {
        console.error('❌ Edit modal not found in DOM');
    }
}

// Close Edit Video Modal
function closeEditVideoModal() {
    const modal = document.getElementById('editVideoModal');
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
        console.log('✅ Edit modal closed');
        
        // Clear the current editing video reference
        window.currentEditingVideo = null;
    }
}

// Apply visual filter to video preview
function applyVideoFilter(filter) {
    const video = document.getElementById('editVideoPreviewFrame');
    if (video) {
        video.style.filter = filter === 'none' ? '' : filter;
        window.currentFilter = filter;
    }
}

// Capture frame from video as thumbnail
function captureFrameFromVideo(buttonElement) {
    const video = document.getElementById('editVideoPreviewFrame');
    if (!video || video.readyState < 2) {
        alert('Please wait for video to load or play the video to capture a frame.');
        return;
    }

    const canvas = document.createElement('canvas');
    // Use logical width/height to keep quality manageable but clear
    const scale = Math.min(1280 / video.videoWidth, 1);
    canvas.width = video.videoWidth * scale;
    canvas.height = video.videoHeight * scale;

    const ctx = canvas.getContext('2d');

    // Apply current filter to canvas if set
    if (window.currentFilter && window.currentFilter !== 'none') {
        ctx.filter = window.currentFilter;
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        document.getElementById('capturePreviewImg').src = dataUrl;
        document.getElementById('editVideoThumb').value = dataUrl;

        // Visual feedback
        const btn = buttonElement;
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-check"></i> Captured!';
        btn.style.background = '#48bb78';
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.style.background = '';
        }, 2000);
    } catch (e) {
        console.error('Capture failed:', e);
        alert('Could not capture frame. This might be due to cross-origin restrictions on the video file.');
    }
}

// Save Video Edit
async function saveVideoEdit() {
    console.log('💾 Saving video edits...');
    
    const videoId = document.getElementById('editVideoId')?.value;
    if (!videoId) {
        alert('❌ Error: Video ID not found');
        return;
    }

    // Build updates object with only the fields that exist in the modal
    const updates = {
        title: document.getElementById('editVideoTitle')?.value || '',
        description: document.getElementById('editVideoDesc')?.value || '',
        visibility: document.getElementById('editVideoVisibility')?.value || 'public',
        category: document.getElementById('editVideoCategory')?.value || 'other'
    };

    // Add thumbnail if it was uploaded or generated
    if (currentThumbnailFile) {
        console.log('📸 Including thumbnail file in update');
        // Convert file to base64 for upload
        const reader = new FileReader();
        reader.onload = async function(e) {
            updates.thumbnailUrl = e.target.result;  // Changed from 'thumbnail' to 'thumbnailUrl'
            await performUpdate(videoId, updates);
        };
        reader.readAsDataURL(currentThumbnailFile);
    } else {
        await performUpdate(videoId, updates);
    }
}

async function performUpdate(videoId, updates) {
    console.log('📝 Update data:', updates);

    try {
        // Use the global api service to ensure consistent authentication
        const response = await api.updateVideo(videoId, updates);

        if (response.success) {
            console.log('✅ Video updated successfully');
            alert('✅ Video updated successfully!');
            
            // Clear thumbnail file
            currentThumbnailFile = null;
            
            closeEditVideoModal();

            // Reload the video list to show updated information
            if (typeof loadUserVideos === 'function') {
                loadUserVideos();
            }
            if (typeof loadDashboardData === 'function') {
                loadDashboardData();
            }
        } else {
            throw new Error(response.message || 'Failed to update video');
        }
    } catch (error) {
        console.error('❌ Update error:', error);
        alert('❌ Error saving video: ' + error.message);
    }
}

// Delete Video Function
async function deleteVideo(videoId, videoTitle) {
    console.log('🗑️ Delete video requested:', videoId);

    if (!confirm(`Are you sure you want to delete "${videoTitle}"?\n\nThis action cannot be undone.`)) {
        return;
    }

    try {
        const session = AuthService.getSessionData();
        const token = session.token;

        console.log('🗑️ Deleting video:', videoId);

        const response = await fetch(`${BHUBAN_CONFIG.api.videos}/${videoId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (response.ok && data.success) {
            console.log('✅ Video deleted successfully');
            alert('✅ Video deleted successfully!');

            // Reload videos
            if (typeof loadUserVideos === 'function') {
                loadUserVideos();
            }
            if (typeof loadDashboardData === 'function') {
                loadDashboardData();
            }

            // Broadcast deletion to other tabs
            localStorage.setItem('videoDeleted', Date.now().toString());
        } else {
            console.error('❌ Delete failed:', data);
            alert('❌ Failed to delete video: ' + (data.message || 'Unknown error'));
        }
    } catch (error) {
        console.error('❌ Delete error:', error);
        alert('❌ Error deleting video: ' + error.message);
    }
}

console.log('✅ Delete and Edit functions loaded');

// Edit Modal Helper Functions
function updateEditCharCount(inputId, countId, max) {
    const input = document.getElementById(inputId);
    const count = document.getElementById(countId);
    if (input && count) {
        count.textContent = input.value.length;
        if (input.value.length >= max) {
            count.style.color = 'var(--error)';
        } else {
            count.style.color = 'var(--text-muted)';
        }
    }
}

// Redundant override removed. Logic integrated into main openEditVideoModal.


// Advanced Video Features Functions
function openSubtitlesManager() {
    console.log('📝 Opening subtitles manager...');
    alert('Subtitles Manager\n\nFeature coming soon! You will be able to:\n• Upload subtitle files (.srt, .vtt)\n• Auto-generate subtitles with AI\n• Translate subtitles to multiple languages\n• Edit subtitle timing and text');
}

function openEndScreenEditor() {
    console.log('🎬 Opening end screen editor...');
    alert('End Screen Editor\n\nFeature coming soon! You will be able to:\n• Add video recommendations\n• Add subscribe button\n• Add playlist links\n• Add channel links\n• Customize layout and timing');
}

function importEndScreenFromVideo() {
    console.log('📥 Importing end screen from another video...');
    alert('Import End Screen\n\nFeature coming soon! You will be able to:\n• Select from your existing videos\n• Copy end screen layout\n• Modify imported elements\n• Save as template');
}

function openCardsEditor() {
    console.log('🎴 Opening cards editor...');
    alert('Cards Editor\n\nFeature coming soon! You will be able to:\n• Add video cards\n• Add playlist cards\n• Add channel cards\n• Add poll cards\n• Set card timing and position');
}


// Thumbnail Management Functions
let currentThumbnailFile = null;
let currentVideoUrl = null;

function handleThumbnailUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file (JPG, PNG, or GIF)');
        return;
    }
    
    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
        alert('Image size must be less than 2MB');
        return;
    }
    
    currentThumbnailFile = file;
    
    // Preview the thumbnail
    const reader = new FileReader();
    reader.onload = function(e) {
        const preview = document.getElementById('editThumbnailPreview');
        if (preview) {
            preview.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover;">`;
        }
    };
    reader.readAsDataURL(file);
    
    console.log('✅ Thumbnail uploaded:', file.name);
}

async function generateAutoThumbnail() {
    console.log('🎬 Generating thumbnail from video...');
    
    const videoId = document.getElementById('editVideoId').value;
    if (!videoId) {
        alert('No video selected');
        return;
    }
    
    try {
        // Get video data
        const session = AuthService.getSessionData();
        const response = await fetch(`${BHUBAN_CONFIG.api.videos}/${videoId}`, {
            headers: { 'Authorization': `Bearer ${session.token}` }
        });
        
        if (!response.ok) throw new Error('Failed to fetch video');
        const data = await response.json();
        
        if (!data.success || !data.data) throw new Error('Video not found');
        
        const video = data.data;
        let videoUrl = video.videoUrl || video.url;
        
        if (!videoUrl) {
            alert('Video file not found. Please upload a video first.');
            return;
        }
        
        // Ensure video URL is absolute
        if (!videoUrl.startsWith('http')) {
            // If it's a relative path, construct full URL
            videoUrl = `http://localhost:5000/uploads/${videoUrl}`;
        }
        
        console.log('📹 Video URL for capture:', videoUrl);
        
        // Open frame capture modal
        openFrameCaptureModal(videoUrl);
        
    } catch (error) {
        console.error('❌ Error generating thumbnail:', error);
        alert('Error loading video. Please try uploading a custom thumbnail instead.');
    }
}

function openFrameCaptureModal(videoUrl) {
    // Create modal for frame capture
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.style.zIndex = '10001';
    modal.innerHTML = `
        <div class="upload-modal" style="max-width: 800px;">
            <div class="modal-header">
                <h2 class="modal-title">
                    <i class="fas fa-camera" style="color: var(--accent-orange); margin-right: 12px;"></i>
                    Capture Thumbnail from Video
                </h2>
                <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body" style="padding: 32px;">
                <div style="margin-bottom: 20px;">
                    <video id="frameCaptureVideo" controls crossorigin="anonymous" style="width: 100%; max-height: 400px; background: #000; border-radius: 8px;">
                        <source src="${videoUrl}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <label style="display: block; font-size: 14px; font-weight: 600; margin-bottom: 8px;">
                        <i class="fas fa-clock"></i> Select Frame Time
                    </label>
                    <input type="range" id="frameSeeker" min="0" max="100" value="0" 
                           style="width: 100%; margin-bottom: 8px;"
                           oninput="seekToFrame(this.value)">
                    <div style="display: flex; justify-content: space-between; font-size: 12px; color: var(--text-muted);">
                        <span id="currentFrameTime">0:00</span>
                        <span id="totalFrameTime">0:00</span>
                    </div>
                </div>
                
                <div style="display: flex; gap: 12px;">
                    <button class="btn-cancel" onclick="this.closest('.modal-overlay').remove()" style="flex: 1;">
                        Cancel
                    </button>
                    <button class="btn-publish" onclick="captureCurrentFrame()" style="flex: 1;">
                        <i class="fas fa-camera"></i>
                        Capture This Frame
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Setup video player
    const video = document.getElementById('frameCaptureVideo');
    const seeker = document.getElementById('frameSeeker');
    
    video.addEventListener('loadedmetadata', function() {
        seeker.max = video.duration;
        document.getElementById('totalFrameTime').textContent = formatTime(video.duration);
    });
    
    video.addEventListener('timeupdate', function() {
        if (!video.seeking) {
            seeker.value = video.currentTime;
            document.getElementById('currentFrameTime').textContent = formatTime(video.currentTime);
        }
    });
}

function seekToFrame(time) {
    const video = document.getElementById('frameCaptureVideo');
    if (video) {
        video.currentTime = time;
        document.getElementById('currentFrameTime').textContent = formatTime(time);
    }
}

function captureCurrentFrame() {
    const video = document.getElementById('frameCaptureVideo');
    if (!video || video.readyState < 2) {
        alert('Please wait for video to load');
        return;
    }
    
    // Create canvas to capture frame
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    
    const ctx = canvas.getContext('2d');
    
    // Calculate dimensions to maintain aspect ratio
    const videoAspect = video.videoWidth / video.videoHeight;
    const canvasAspect = canvas.width / canvas.height;
    
    let drawWidth, drawHeight, offsetX, offsetY;
    
    if (videoAspect > canvasAspect) {
        drawHeight = canvas.height;
        drawWidth = drawHeight * videoAspect;
        offsetX = (canvas.width - drawWidth) / 2;
        offsetY = 0;
    } else {
        drawWidth = canvas.width;
        drawHeight = drawWidth / videoAspect;
        offsetX = 0;
        offsetY = (canvas.height - drawHeight) / 2;
    }
    
    // Fill background
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw video frame
    try {
        ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
    } catch (error) {
        console.error('❌ Error drawing video frame:', error);
        alert('Failed to capture frame. This may be due to CORS restrictions on the video file.');
        return;
    }
    
    // Try to convert to blob, with fallback to dataURL
    try {
        canvas.toBlob(function(blob) {
            if (!blob) {
                // Fallback to dataURL method
                useFallbackCapture(canvas);
                return;
            }
            
            // Create file from blob
            const file = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
            currentThumbnailFile = file;
            
            // Preview the thumbnail
            const reader = new FileReader();
            reader.onload = function(e) {
                const preview = document.getElementById('editThumbnailPreview');
                if (preview) {
                    preview.innerHTML = `<img src="${e.target.result}" style="width: 100%; height: 100%; object-fit: cover;">`;
                }
            };
            reader.readAsDataURL(file);
            
            // Close modal
            document.querySelector('.modal-overlay[style*="10001"]').remove();
            
            console.log('✅ Frame captured successfully');
            alert('Thumbnail captured! Click "Save Changes" to apply.');
            
        }, 'image/jpeg', 0.9);
    } catch (error) {
        console.error('❌ Canvas toBlob error:', error);
        // Use fallback method
        useFallbackCapture(canvas);
    }
}

// Fallback capture method using dataURL
function useFallbackCapture(canvas) {
    try {
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        // Convert dataURL to blob
        fetch(dataUrl)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], 'thumbnail.jpg', { type: 'image/jpeg' });
                currentThumbnailFile = file;
                
                // Preview the thumbnail
                const preview = document.getElementById('editThumbnailPreview');
                if (preview) {
                    preview.innerHTML = `<img src="${dataUrl}" style="width: 100%; height: 100%; object-fit: cover;">`;
                }
                
                // Close modal
                const modal = document.querySelector('.modal-overlay[style*="10001"]');
                if (modal) modal.remove();
                
                console.log('✅ Frame captured successfully (fallback method)');
                alert('Thumbnail captured! Click "Save Changes" to apply.');
            })
            .catch(err => {
                console.error('❌ Fallback capture failed:', err);
                alert('Failed to capture frame. Please try uploading a custom thumbnail instead.');
            });
    } catch (error) {
        console.error('❌ DataURL conversion failed:', error);
        alert('Failed to capture frame due to security restrictions. Please upload a custom thumbnail instead.');
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function removeThumbnail() {
    if (!confirm('Remove current thumbnail?')) return;
    
    currentThumbnailFile = null;
    const preview = document.getElementById('editThumbnailPreview');
    if (preview) {
        preview.innerHTML = '<i class="fas fa-image" style="font-size: 32px; color: var(--text-muted); opacity: 0.3;"></i>';
    }
    
    console.log('🗑️ Thumbnail removed');
}

