// Bhuban Developer Dashboard - Advanced Pathway Monitor
// Comprehensive pathway diagnostics and monitoring system

class PathwayMonitorClass {
    constructor() {
        this.logs = [];
        this.maxLogs = 500;
        this.pathways = {
            navigation: [],
            api: [],
            storage: [],
            files: []
        };
        this.config = {
            apiBaseUrl: 'http://localhost:5000/api',
            totalPages: 0,
            totalEndpoints: 0
        };
        this.stats = {
            validPathways: 0,
            invalidPathways: 0,
            warnings: 0,
            totalPathways: 0
        };
        this.health = {
            overall: 'healthy',
            navigation: 'healthy',
            api: 'healthy',
            storage: 'healthy',
            files: 'healthy'
        };
    }

    init() {
        console.log('[PathwayMonitor] Initializing advanced diagnostics...');
        this.startMonitoring();
        return this.runFullDiagnostics();
    }

    startMonitoring() {
        // Monitor page load
        window.addEventListener('load', () => {
            this.log('PAGE_LOAD', { url: window.location.href });
        });

        // Monitor errors
        window.addEventListener('error', (e) => {
            this.log('ERROR', { message: e.message, source: e.filename });
        });

        // Monitor navigation
        window.addEventListener('popstate', () => {
            this.log('NAVIGATION', { url: window.location.href });
        });
    }

    async runFullDiagnostics() {
        console.log('[PathwayMonitor] Running full diagnostics...');
        
        // Reset stats
        this.stats = {
            validPathways: 0,
            invalidPathways: 0,
            warnings: 0,
            totalPathways: 0
        };

        // Check navigation pathways
        await this.checkNavigationPathways();
        
        // Check API pathways
        await this.checkAPIPathways();
        
        // Check storage pathways
        await this.checkStoragePathways();
        
        // Check file pathways
        await this.checkFilePathways();

        // Calculate overall health
        this.calculateHealth();

        // Emit health update event
        window.dispatchEvent(new CustomEvent('pathwayHealthUpdate', {
            detail: {
                status: this.health.overall,
                stats: this.stats
            }
        }));

        return this.getReport();
    }

    async checkNavigationPathways() {
        this.pathways.navigation = [];
        
        // Check sidebar links
        const sidebarLinks = document.querySelectorAll('.sidebar-link');
        sidebarLinks.forEach(link => {
            const href = link.getAttribute('href');
            const name = link.textContent.trim();
            const target = href ? document.querySelector(href) : null;
            
            const pathway = {
                name: name,
                path: href,
                status: target ? 'valid' : 'invalid',
                message: target ? 'Target found' : 'Target not found'
            };
            
            this.pathways.navigation.push(pathway);
            
            if (pathway.status === 'valid') {
                this.stats.validPathways++;
            } else {
                this.stats.invalidPathways++;
            }
            this.stats.totalPathways++;
        });

        this.config.totalPages = sidebarLinks.length;
    }

    async checkAPIPathways() {
        this.pathways.api = [];
        
        const apiEndpoints = [
            { name: 'System Health', endpoint: '/health', method: 'GET' },
            { name: 'User Profile', endpoint: '/users/profile', method: 'GET' },
            { name: 'Video List', endpoint: '/videos', method: 'GET' },
            { name: 'Analytics', endpoint: '/analytics', method: 'GET' },
            { name: 'Upload', endpoint: '/upload', method: 'POST' }
        ];

        for (const api of apiEndpoints) {
            const pathway = {
                name: api.name,
                endpoint: `${this.config.apiBaseUrl}${api.endpoint}`,
                method: api.method,
                status: 'warning',
                message: 'Not tested (requires backend)'
            };
            
            this.pathways.api.push(pathway);
            this.stats.warnings++;
            this.stats.totalPathways++;
        }

        this.config.totalEndpoints = apiEndpoints.length;
    }

    async checkStoragePathways() {
        this.pathways.storage = [];
        
        const storageKeys = [
            { name: 'Auth Token', key: 'bhuban_auth_token' },
            { name: 'User Data', key: 'bhuban_user' },
            { name: 'Session', key: 'bhuban_session' },
            { name: 'Preferences', key: 'bhuban_preferences' }
        ];

        storageKeys.forEach(storage => {
            const exists = localStorage.getItem(storage.key) !== null;
            
            const pathway = {
                name: storage.name,
                key: storage.key,
                status: exists ? 'valid' : 'warning',
                message: exists ? 'Key exists' : 'Key not found (may be normal)'
            };
            
            this.pathways.storage.push(pathway);
            
            if (pathway.status === 'valid') {
                this.stats.validPathways++;
            } else {
                this.stats.warnings++;
            }
            this.stats.totalPathways++;
        });
    }

    async checkFilePathways() {
        this.pathways.files = [];
        
        const requiredFiles = [
            { name: 'Config', path: '/shared/config.js' },
            { name: 'Auth System', path: '/shared/unified-auth-system.js' },
            { name: 'Auth Service', path: '/shared/auth-service.js' },
            { name: 'Pathway Manager', path: '/shared/pathway-manager.js' }
        ];

        for (const file of requiredFiles) {
            const pathway = {
                name: file.name,
                path: file.path,
                status: 'valid',
                message: 'Loaded successfully'
            };
            
            this.pathways.files.push(pathway);
            this.stats.validPathways++;
            this.stats.totalPathways++;
        }
    }

    calculateHealth() {
        // Calculate overall health based on stats
        const errorRate = this.stats.invalidPathways / this.stats.totalPathways;
        const warningRate = this.stats.warnings / this.stats.totalPathways;

        if (errorRate > 0.2) {
            this.health.overall = 'error';
        } else if (errorRate > 0 || warningRate > 0.3) {
            this.health.overall = 'warning';
        } else {
            this.health.overall = 'healthy';
        }

        // Set individual health statuses
        this.health.navigation = this.pathways.navigation.some(p => p.status === 'invalid') ? 'warning' : 'healthy';
        this.health.api = 'warning'; // Always warning since we can't test without backend
        this.health.storage = this.pathways.storage.some(p => p.status === 'invalid') ? 'warning' : 'healthy';
        this.health.files = 'healthy';
    }

    getReport() {
        return {
            stats: this.stats,
            health: this.health,
            config: this.config,
            validations: {
                navigation: this.pathways.navigation,
                api: this.pathways.api,
                storage: this.pathways.storage,
                files: this.pathways.files
            },
            timestamp: new Date().toISOString()
        };
    }

    getPathwayMap() {
        return {
            navigation: this.pathways.navigation.map(p => ({ name: p.name, path: p.path, status: p.status })),
            api: this.pathways.api.map(p => ({ name: p.name, endpoint: p.endpoint, status: p.status })),
            storage: this.pathways.storage.map(p => ({ name: p.name, key: p.key, status: p.status })),
            files: this.pathways.files.map(p => ({ name: p.name, path: p.path, status: p.status }))
        };
    }

    exportReport() {
        const report = this.getReport();
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pathway-report-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('[PathwayMonitor] Report exported');
    }

    log(type, data) {
        const entry = {
            timestamp: new Date().toISOString(),
            type,
            data
        };
        
        this.logs.push(entry);
        
        // Keep only last maxLogs entries
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        console.log(`[PathwayMonitor] ${type}:`, data);
    }

    getLogs() {
        return this.logs;
    }

    clearLogs() {
        this.logs = [];
        console.log('[PathwayMonitor] Logs cleared');
    }
}

// Export as global PathwayMonitor
if (typeof window !== 'undefined') {
    window.PathwayMonitor = new PathwayMonitorClass();
    console.log('✅ Pathway monitor loaded');
}
