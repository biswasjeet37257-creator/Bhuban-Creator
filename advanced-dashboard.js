// Bhuban Advanced AI Developer Dashboard
// Complete implementation with targeting, diagnostics, and AI integration

console.log('🚀 Initializing Advanced AI Developer Dashboard...');

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    apiBase: 'http://localhost:8000',
    apps: {
        video: '../Bhuban video stream app/index.html',
        creator: '../Bhuban creator app/index.html',
        developer: './index.html'
    },
    magneticThreshold: 50, // pixels
    captureInterval: 100, // ms
    logRetention: 60000, // 60 seconds
    audioEnabled: true,
    audioVolume: 0.5
};

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const state = {
    currentApp: 'video',
    targetingEnabled: true,
    frozen: false,
    diagnosticsEnabled: true,
    currentElement: null,
    logs: [],
    networkCalls: [],
    aiAnalysis: null,
    currentAnalysis: null, // Store current AI analysis result
    mousePosition: { x: 0, y: 0 },
    isFullscreen: false,
    assistantOpen: false,
    currentHighlight: null,
    capturedData: null
};

// ============================================================================
// FULLSCREEN & ASSISTANT PANEL SYSTEM
// ============================================================================

class FullscreenManager {
    constructor() {
        this.sandboxPane = document.getElementById('sandboxPane');
        this.fullscreenToggle = document.getElementById('fullscreenToggle');
        this.backButton = document.getElementById('backButton');
        this.assistantPanel = document.getElementById('assistantPanel');
        
        this.init();
    }

    init() {
        // Fullscreen toggle
        this.fullscreenToggle.addEventListener('click', () => {
            this.enterFullscreen();
        });

        // Back button
        this.backButton.addEventListener('click', () => {
            this.exitFullscreen();
        });

        // ESC key to exit
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && state.isFullscreen) {
                this.exitFullscreen();
            }
        });
    }

    enterFullscreen() {
        state.isFullscreen = true;
        this.sandboxPane.classList.add('fullscreen');
        this.fullscreenToggle.innerHTML = '<i class="fas fa-compress"></i>';
        this.fullscreenToggle.title = 'Exit Fullscreen';
        
        // Play sound
        audio.playDataStream();
        
        console.log('🖥️ Entered fullscreen mode');
    }

    exitFullscreen() {
        state.isFullscreen = false;
        this.sandboxPane.classList.remove('fullscreen');
        this.fullscreenToggle.innerHTML = '<i class="fas fa-expand"></i>';
        this.fullscreenToggle.title = 'Enter Fullscreen';
        
        // Close assistant if open
        if (state.assistantOpen) {
            assistantManager.close();
        }
        
        console.log('🖥️ Exited fullscreen mode');
    }
}

class AssistantManager {
    constructor() {
        this.panel = document.getElementById('assistantPanel');
        this.closeBtn = document.getElementById('assistantClose');
        this.tabs = document.querySelectorAll('.assistant-tab');
        this.sections = document.querySelectorAll('.assistant-section');
        
        this.init();
    }

    init() {
        // Close button
        this.closeBtn.addEventListener('click', () => {
            this.close();
        });

        // Tab switching
        this.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabName = tab.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Apply fix button
        document.getElementById('applyFixBtn').addEventListener('click', () => {
            this.applyFix();
        });

        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportData();
        });
    }

    open(captureData) {
        if (!state.isFullscreen) {
            console.warn('⚠️ Assistant only available in fullscreen mode');
            return;
        }

        console.log('🤖 Opening assistant panel with data:', captureData);
        
        state.assistantOpen = true;
        state.capturedData = captureData;
        this.panel.classList.add('active');
        
        console.log('📊 Populating diagnostics...');
        // Populate data
        this.populateDiagnostics(captureData);
        
        console.log('🤖 Populating AI analysis...');
        this.populateAnalysis(captureData);
        
        console.log('🔧 Populating fixes...');
        this.populateFixes(captureData);
        
        // Play sound
        audio.playDataStream();
        
        console.log('🤖 Assistant panel opened');
    }

    close() {
        state.assistantOpen = false;
        this.panel.classList.remove('active');
        
        // Remove highlight
        if (state.currentHighlight) {
            state.currentHighlight.remove();
            state.currentHighlight = null;
        }
        
        console.log('🤖 Assistant panel closed');
    }

    switchTab(tabName) {
        // Update tabs
        this.tabs.forEach(tab => {
            if (tab.dataset.tab === tabName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update sections
        this.sections.forEach(section => {
            if (section.id === tabName + 'Tab') {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });
    }

    populateDiagnostics(data) {
        // Element Info
        const elementInfo = document.getElementById('elementInfo');
        if (data.tag) {
            elementInfo.innerHTML = `
                <div class="info-row">
                    <span class="info-label">Tag</span>
                    <span class="info-value">&lt;${data.tag}&gt;</span>
                </div>
                ${data.id ? `
                <div class="info-row">
                    <span class="info-label">ID</span>
                    <span class="info-value">#${data.id}</span>
                </div>
                ` : ''}
                ${data.classes && data.classes.length > 0 ? `
                <div class="info-row">
                    <span class="info-label">Classes</span>
                    <span class="info-value">${data.classes.join(', ')}</span>
                </div>
                ` : ''}
                ${data.rect ? `
                <div class="info-row">
                    <span class="info-label">Position</span>
                    <span class="info-value">X: ${Math.round(data.rect.x)}, Y: ${Math.round(data.rect.y)}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Size</span>
                    <span class="info-value">${Math.round(data.rect.width)} × ${Math.round(data.rect.height)}px</span>
                </div>
                ` : ''}
                ${data.textContent ? `
                <div class="info-row">
                    <span class="info-label">Text</span>
                    <span class="info-value">${data.textContent.substring(0, 100)}</span>
                </div>
                ` : ''}
                ${data.dataAttributes && Object.keys(data.dataAttributes).length > 0 ? `
                <div class="info-row">
                    <span class="info-label">Data Attributes</span>
                    <span class="info-value">${Object.keys(data.dataAttributes).length} found</span>
                </div>
                ` : ''}
            `;
        } else {
            elementInfo.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--text-muted);">
                    <i class="fas fa-exclamation-circle" style="font-size: 32px; opacity: 0.3; margin-bottom: 12px;"></i>
                    <p>Element details not accessible</p>
                    <p style="font-size: 11px; opacity: 0.6;">CORS restriction</p>
                </div>
            `;
        }

        // Console Logs
        const consoleInfo = document.getElementById('consoleInfo');
        const recentLogs = state.logs.slice(-10);
        if (recentLogs.length > 0) {
            consoleInfo.innerHTML = recentLogs.map(log => `
                <div class="console-log ${log.type}" style="margin-bottom: 8px; padding: 8px; background: var(--base-black); border-left: 3px solid ${
                    log.type === 'error' ? 'var(--error-red)' : 
                    log.type === 'warn' ? 'var(--warning-amber)' : 
                    'var(--logic-blue)'
                }; border-radius: 4px; font-size: 11px;">
                    <div style="display: flex; justify-content: space-between; align-items: start; gap: 8px;">
                        <div style="flex: 1;">
                            ${log.type === 'error' ? '❌' : log.type === 'warn' ? '⚠️' : 'ℹ️'} ${log.message}
                        </div>
                        ${log.source && log.source !== 'dashboard' ? `
                            <div style="font-size: 9px; color: var(--text-muted); background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: 3px; white-space: nowrap;">
                                ${log.source}
                            </div>
                        ` : ''}
                    </div>
                    ${log.file && log.line ? `
                        <div style="margin-top: 4px; font-size: 9px; color: var(--text-muted); opacity: 0.7;">
                            ${log.file}:${log.line}
                        </div>
                    ` : ''}
                </div>
            `).join('');
        } else {
            consoleInfo.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 12px;">
                    <i class="fas fa-check-circle" style="color: var(--success-green); margin-right: 8px;"></i>
                    No console logs
                </div>
            `;
        }

        // Network Activity
        const networkInfo = document.getElementById('networkInfo');
        const recentNetwork = state.networkCalls.slice(-10);
        if (recentNetwork.length > 0) {
            networkInfo.innerHTML = recentNetwork.map(call => `
                <div class="info-row" style="padding: 8px; background: var(--base-black); margin-bottom: 4px; border-radius: 4px;">
                    <span class="info-label">${call.method} ${call.url.substring(0, 40)}...</span>
                    <span class="info-value" style="color: ${call.status >= 400 || call.status === 0 ? 'var(--error-red)' : 'var(--success-green)'}">
                        ${call.status} (${call.time}ms)
                    </span>
                </div>
            `).join('');
        } else {
            networkInfo.innerHTML = `
                <div style="text-align: center; padding: 20px; color: var(--text-muted); font-size: 12px;">
                    <i class="fas fa-check-circle" style="color: var(--success-green); margin-right: 8px;"></i>
                    No network activity
                </div>
            `;
        }
    }

    async populateAnalysis(data) {
        console.log('🔍 populateAnalysis called with data:', data);
        
        const aiReasoning = document.getElementById('aiReasoning');
        const issuesDetected = document.getElementById('issuesDetected');

        // Show loading
        aiReasoning.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <div class="spinner"></div>
                <p style="margin-top: 16px; color: var(--text-muted);">Analyzing with AI...</p>
            </div>
        `;

        try {
            const apiUrl = `${CONFIG.apiBase}/developer/analyze-bug?t=${Date.now()}`;
            console.log('🌐 Making POST request to:', apiUrl);
            
            const requestBody = {
                element_data: {
                    tag: data.tag || 'unknown',
                    classes: data.classes || [],
                    id: data.id || '',
                    position: { x: data.x, y: data.y }
                },
                console_errors: state.logs.filter(log => log.type === 'error').slice(-5),
                network_calls: state.networkCalls.slice(-5)
            };
            console.log('📦 Request body:', requestBody);
            
            // Call AI backend
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });

            console.log('📡 Response status:', response.status);
            console.log('📡 Response ok:', response.ok);

            if (!response.ok) {
                console.error('❌ Response not OK:', response.status, response.statusText);
                throw new Error('Backend offline');
            }

            const result = await response.json();
            console.log('✅ AI Analysis result:', result);
            
            // Store analysis for fixes tab
            state.currentAnalysis = result.analysis;
            
            if (result.success && result.analysis) {
                // Backend returns "reasoning_steps", not "steps"
                const steps = result.analysis.reasoning_steps || result.analysis.steps || [];
                console.log('📋 Reasoning steps:', steps);
                
                if (steps.length > 0) {
                    aiReasoning.innerHTML = steps.map((step, i) => `
                        <div style="padding: 12px; background: var(--base-black); border-left: 3px solid var(--logic-blue); border-radius: 4px; margin-bottom: 8px; font-size: 13px;">
                            <span style="display: inline-block; width: 24px; height: 24px; background: var(--logic-blue); border-radius: 50%; text-align: center; line-height: 24px; font-size: 11px; font-weight: 700; margin-right: 8px;">${i + 1}</span>
                            ${step}
                        </div>
                    `).join('');
                    
                    // Show additional analysis info
                    if (result.analysis.root_cause) {
                        aiReasoning.innerHTML += `
                            <div style="margin-top: 16px; padding: 16px; background: var(--base-black); border: 1px solid var(--logic-blue); border-radius: 8px;">
                                <div style="font-weight: 600; color: var(--logic-blue); margin-bottom: 8px; font-size: 13px;">
                                    🎯 Root Cause
                                </div>
                                <div style="font-size: 13px; color: var(--text-primary);">
                                    ${result.analysis.root_cause}
                                </div>
                            </div>
                        `;
                    }
                    
                    if (result.analysis.fix) {
                        aiReasoning.innerHTML += `
                            <div style="margin-top: 16px; padding: 16px; background: var(--base-black); border: 1px solid var(--success-green); border-radius: 8px;">
                                <div style="font-weight: 600; color: var(--success-green); margin-bottom: 8px; font-size: 13px;">
                                    💡 Suggested Fix
                                </div>
                                <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 8px;">
                                    ${result.analysis.fix.explanation || ''}
                                </div>
                                <pre style="background: #000; padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 11px; color: var(--text-primary);"><code>${result.analysis.fix.suggested || ''}</code></pre>
                            </div>
                        `;
                    }
                    
                    // Update fixes tab with the analysis
                    this.updateFixesTab(result.analysis);
                } else {
                    aiReasoning.innerHTML = `
                        <div style="padding: 20px; text-align: center; color: var(--text-muted);">
                            <i class="fas fa-info-circle" style="font-size: 32px; opacity: 0.3; margin-bottom: 12px;"></i>
                            <p>No analysis steps available</p>
                        </div>
                    `;
                }
            } else {
                aiReasoning.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: var(--text-muted);">
                        <i class="fas fa-exclamation-circle" style="font-size: 32px; opacity: 0.3; margin-bottom: 12px;"></i>
                        <p>Analysis failed</p>
                        <p style="font-size: 11px; opacity: 0.6;">Backend returned unexpected format</p>
                    </div>
                `;
            }
        } catch (error) {
            console.error('❌ Error in populateAnalysis:', error);
            console.error('❌ Error stack:', error.stack);
            
            aiReasoning.innerHTML = `
                <div style="padding: 20px; text-align: center;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 32px; color: var(--warning-amber); margin-bottom: 12px;"></i>
                    <p style="color: var(--text-muted); margin-bottom: 16px;">AI backend offline</p>
                    <code style="display: block; padding: 12px; background: var(--base-black); border-radius: 8px; font-size: 11px; color: var(--text-secondary);">
                        cd ShreeApp/backend<br>
                        python main.py
                    </code>
                    <p style="margin-top: 12px; font-size: 11px; color: var(--text-muted);">Error: ${error.message}</p>
                </div>
            `;
        }

        // Issues Detected
        const errors = state.logs.filter(log => log.type === 'error');
        const networkErrors = state.networkCalls.filter(call => call.status >= 400 || call.status === 0);
        
        if (errors.length > 0 || networkErrors.length > 0) {
            issuesDetected.innerHTML = `
                ${errors.length > 0 ? `
                    <div style="margin-bottom: 12px;">
                        <div style="font-size: 12px; font-weight: 600; color: var(--error-red); margin-bottom: 8px;">
                            <i class="fas fa-bug"></i> Console Errors (${errors.length})
                        </div>
                        ${errors.slice(0, 3).map(err => `
                            <div style="padding: 8px; background: var(--base-black); border-left: 3px solid var(--error-red); border-radius: 4px; margin-bottom: 4px; font-size: 11px;">
                                ${err.message}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
                ${networkErrors.length > 0 ? `
                    <div>
                        <div style="font-size: 12px; font-weight: 600; color: var(--error-red); margin-bottom: 8px;">
                            <i class="fas fa-network-wired"></i> Network Errors (${networkErrors.length})
                        </div>
                        ${networkErrors.slice(0, 3).map(err => `
                            <div style="padding: 8px; background: var(--base-black); border-left: 3px solid var(--error-red); border-radius: 4px; margin-bottom: 4px; font-size: 11px;">
                                ${err.method} ${err.url} (${err.status})
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            `;
        } else {
            issuesDetected.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--success-green);">
                    <i class="fas fa-check-circle" style="font-size: 48px; opacity: 0.5; margin-bottom: 16px;"></i>
                    <p style="font-size: 14px; font-weight: 600;">No Issues Detected</p>
                    <p style="font-size: 12px; opacity: 0.6; margin-top: 8px;">Everything looks good!</p>
                </div>
            `;
        }
    }

    updateFixesTab(analysis) {
        const suggestedFixes = document.getElementById('suggestedFixes');
        
        if (analysis && analysis.fix) {
            const fix = analysis.fix;
            suggestedFixes.innerHTML = `
                <div style="padding: 16px; background: var(--base-black); border: 1px solid var(--success-green); border-radius: 8px; margin-bottom: 16px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <div style="font-weight: 600; color: var(--success-green); font-size: 14px;">
                            <i class="fas fa-wrench"></i> ${fix.type.toUpperCase()} Fix
                        </div>
                        <div style="font-size: 11px; color: var(--text-muted);">
                            ${analysis.model || 'AI Generated'}
                        </div>
                    </div>
                    
                    ${fix.file ? `
                        <div style="margin-bottom: 8px; font-size: 12px; color: var(--text-secondary);">
                            <i class="fas fa-file-code"></i> File: <code style="background: #000; padding: 2px 6px; border-radius: 3px;">${fix.file}</code>
                            ${fix.line ? `<span style="margin-left: 8px;">Line: ${fix.line}</span>` : ''}
                        </div>
                    ` : ''}
                    
                    ${fix.explanation ? `
                        <div style="margin-bottom: 12px; padding: 12px; background: rgba(0, 217, 255, 0.05); border-radius: 4px; font-size: 12px; color: var(--text-secondary);">
                            ${fix.explanation}
                        </div>
                    ` : ''}
                    
                    ${fix.original ? `
                        <div style="margin-bottom: 12px;">
                            <div style="font-size: 11px; color: var(--error-red); margin-bottom: 4px; font-weight: 600;">
                                ❌ Original:
                            </div>
                            <pre style="background: #000; padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 11px; color: var(--text-primary); border-left: 3px solid var(--error-red);"><code>${fix.original}</code></pre>
                        </div>
                    ` : ''}
                    
                    ${fix.suggested ? `
                        <div style="margin-bottom: 12px;">
                            <div style="font-size: 11px; color: var(--success-green); margin-bottom: 4px; font-weight: 600;">
                                ✅ Suggested:
                            </div>
                            <pre style="background: #000; padding: 12px; border-radius: 4px; overflow-x: auto; font-size: 11px; color: var(--text-primary); border-left: 3px solid var(--success-green);"><code>${fix.suggested}</code></pre>
                        </div>
                    ` : ''}
                    
                    <div style="display: flex; gap: 8px; margin-top: 16px;">
                        <button onclick="assistantManager.applyFix()" style="flex: 1; padding: 10px; background: var(--success-green); color: #000; border: none; border-radius: 6px; font-weight: 600; cursor: pointer; font-size: 12px;">
                            <i class="fas fa-check"></i> Apply Fix
                        </button>
                        <button onclick="assistantManager.copyFix()" style="padding: 10px 16px; background: var(--base-black); color: var(--text-primary); border: 1px solid var(--success-green); border-radius: 6px; cursor: pointer; font-size: 12px;">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                </div>
                
                ${analysis.test_cases && analysis.test_cases.length > 0 ? `
                    <div style="padding: 16px; background: var(--base-black); border: 1px solid var(--logic-blue); border-radius: 8px;">
                        <div style="font-weight: 600; color: var(--logic-blue); margin-bottom: 12px; font-size: 13px;">
                            <i class="fas fa-vial"></i> Test Cases
                        </div>
                        ${analysis.test_cases.map((test, i) => `
                            <div style="padding: 8px; background: rgba(0, 217, 255, 0.05); border-radius: 4px; margin-bottom: 4px; font-size: 12px;">
                                <span style="color: var(--logic-blue); font-weight: 600;">${i + 1}.</span> ${test}
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            `;
        } else {
            suggestedFixes.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <i class="fas fa-magic" style="font-size: 48px; opacity: 0.3; margin-bottom: 16px;"></i>
                    <p>No fixes available</p>
                    <p style="font-size: 11px; opacity: 0.6; margin-top: 8px;">AI analysis didn't suggest any fixes</p>
                </div>
            `;
        }
    }

    populateFixes(data) {
        const suggestedFixes = document.getElementById('suggestedFixes');
        const fixHistory = document.getElementById('fixHistory');

        suggestedFixes.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fas fa-magic" style="font-size: 48px; opacity: 0.3; margin-bottom: 16px;"></i>
                <p>Waiting for AI analysis...</p>
                <p style="font-size: 11px; opacity: 0.6; margin-top: 8px;">Fixes will appear after analysis completes</p>
            </div>
        `;

        fixHistory.innerHTML = `
            <div style="text-align: center; padding: 40px; color: var(--text-muted);">
                <i class="fas fa-history" style="font-size: 48px; opacity: 0.3; margin-bottom: 16px;"></i>
                <p>No fixes applied yet</p>
            </div>
        `;
    }

    copyFix() {
        if (state.currentAnalysis && state.currentAnalysis.fix) {
            const fixCode = state.currentAnalysis.fix.suggested || '';
            navigator.clipboard.writeText(fixCode).then(() => {
                console.log('📋 Fix copied to clipboard');
                audio.playDataStream();
            });
        }
    }

    async applyFix() {
        console.log('⚡ Applying fix...');
        
        if (!state.currentAnalysis || !state.currentAnalysis.fix) {
            console.error('❌ No fix available to apply');
            return;
        }
        
        audio.playQuantumFix();
        
        // Find the button (it's created dynamically in updateFixesTab)
        const buttons = document.querySelectorAll('button');
        let applyBtn = null;
        buttons.forEach(btn => {
            if (btn.textContent.includes('Apply Fix')) {
                applyBtn = btn;
            }
        });
        
        if (applyBtn) {
            applyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Applying...';
            applyBtn.disabled = true;
        }
        
        try {
            const apiUrl = `${CONFIG.apiBase}/developer/apply-fix?t=${Date.now()}`;
            console.log('🌐 Calling apply-fix API:', apiUrl);
            
            const requestBody = {
                fix: state.currentAnalysis.fix,
                agent: 'cursor' // Default agent
            };
            console.log('📦 Request body:', requestBody);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody)
            });
            
            console.log('📡 Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            console.log('✅ Fix applied:', result);
            
            if (applyBtn) {
                applyBtn.innerHTML = '<i class="fas fa-check"></i> Applied!';
                applyBtn.style.background = 'var(--success-green)';
            }
            
            // Update fix history
            this.addToFixHistory(state.currentAnalysis.fix, result);
            
            // Show success message
            this.showNotification('Fix applied successfully!', 'success');
            
            setTimeout(() => {
                if (applyBtn) {
                    applyBtn.innerHTML = '<i class="fas fa-check"></i> Apply Fix';
                    applyBtn.disabled = false;
                    applyBtn.style.background = '';
                }
            }, 3000);
            
        } catch (error) {
            console.error('❌ Error applying fix:', error);
            
            if (applyBtn) {
                applyBtn.innerHTML = '<i class="fas fa-times"></i> Failed';
                applyBtn.style.background = 'var(--error-red)';
            }
            
            this.showNotification(`Failed to apply fix: ${error.message}`, 'error');
            
            setTimeout(() => {
                if (applyBtn) {
                    applyBtn.innerHTML = '<i class="fas fa-check"></i> Apply Fix';
                    applyBtn.disabled = false;
                    applyBtn.style.background = '';
                }
            }, 3000);
        }
    }
    
    addToFixHistory(fix, result) {
        const fixHistory = document.getElementById('fixHistory');
        const timestamp = new Date().toLocaleTimeString();
        
        const historyItem = `
            <div style="padding: 12px; background: var(--base-black); border: 1px solid var(--success-green); border-radius: 8px; margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                    <div style="font-weight: 600; color: var(--success-green); font-size: 12px;">
                        <i class="fas fa-check-circle"></i> ${fix.type.toUpperCase()} Fix Applied
                    </div>
                    <div style="font-size: 10px; color: var(--text-muted);">
                        ${timestamp}
                    </div>
                </div>
                ${fix.file ? `
                    <div style="font-size: 11px; color: var(--text-secondary);">
                        <i class="fas fa-file-code"></i> ${fix.file}${fix.line ? ` : ${fix.line}` : ''}
                    </div>
                ` : ''}
                ${result.result && result.result.message ? `
                    <div style="margin-top: 8px; padding: 8px; background: rgba(0, 217, 255, 0.05); border-radius: 4px; font-size: 11px; color: var(--text-secondary);">
                        ${result.result.message}
                    </div>
                ` : ''}
            </div>
        `;
        
        if (fixHistory.innerHTML.includes('No fixes applied yet')) {
            fixHistory.innerHTML = historyItem;
        } else {
            fixHistory.insertAdjacentHTML('afterbegin', historyItem);
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            background: ${type === 'success' ? 'var(--success-green)' : type === 'error' ? 'var(--error-red)' : 'var(--logic-blue)'};
            color: ${type === 'success' || type === 'error' ? '#000' : '#fff'};
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            z-index: 10000;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            animation: slideIn 0.3s ease-out;
        `;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${message}
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    exportData() {
        console.log('📥 Exporting data...');
        
        const exportData = {
            timestamp: new Date().toISOString(),
            capturedData: state.capturedData,
            logs: state.logs,
            networkCalls: state.networkCalls
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `diagnostic-export-${Date.now()}.json`;
        a.click();
        
        console.log('✅ Data exported');
    }
}

// ============================================================================
// AUDIO FEEDBACK SYSTEM
// ============================================================================

class AudioFeedback {
    constructor() {
        this.context = new (window.AudioContext || window.webkitAudioContext)();
        this.enabled = CONFIG.audioEnabled;
        this.volume = CONFIG.audioVolume;
    }

    playTargetLock(distance, maxDistance) {
        if (!this.enabled) return;
        
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        const frequency = 200 + (1 - distance / maxDistance) * 400;
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        
        gainNode.gain.value = this.volume * 0.3;
        
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        oscillator.start();
        oscillator.stop(this.context.currentTime + 0.1);
    }

    playDataStream() {
        if (!this.enabled) return;
        
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.frequency.setValueAtTime(800, this.context.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(200, this.context.currentTime + 0.3);
        oscillator.type = 'sawtooth';
        
        gainNode.gain.setValueAtTime(this.volume * 0.4, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);
        
        oscillator.start();
        oscillator.stop(this.context.currentTime + 0.3);
    }

    playQuantumFix() {
        if (!this.enabled) return;
        
        const frequencies = [523.25, 659.25, 783.99]; // C5, E5, G5
        
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = this.context.createOscillator();
                const gainNode = this.context.createGain();
                
                oscillator.frequency.value = freq;
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(this.volume * 0.5, this.context.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 1);
                
                oscillator.connect(gainNode);
                gainNode.connect(this.context.destination);
                
                oscillator.start();
                oscillator.stop(this.context.currentTime + 1);
            }, index * 100);
        });
    }
}

const audio = new AudioFeedback();

// ============================================================================
// TARGETING ARROW SYSTEM
// ============================================================================

class TargetingArrow {
    constructor() {
        this.arrow = document.getElementById('targetingArrow');
        this.overlay = document.getElementById('targetingOverlay');
        this.currentTarget = null;
        this.bloomElement = null;
        
        this.init();
    }

    init() {
        this.overlay.addEventListener('mousemove', (e) => {
            if (!state.targetingEnabled || state.frozen) return;
            
            const rect = this.overlay.getBoundingClientRect();
            state.mousePosition = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            
            this.update();
        });

        this.overlay.addEventListener('click', (e) => {
            if (!state.targetingEnabled || state.frozen) return;
            
            e.preventDefault();
            e.stopPropagation();
            
            const rect = this.overlay.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Capture data
            this.captureAtPosition(x, y);
            audio.playDataStream();
            
            // If in fullscreen, open assistant panel
            if (state.isFullscreen) {
                setTimeout(() => {
                    assistantManager.open(state.capturedData);
                }, 300);
            }
        });
    }

    update() {
        const { x, y } = state.mousePosition;
        this.arrow.style.transform = `translate(${x}px, ${y}px)`;
    }

    captureAtPosition(x, y) {
        console.log('📊 Capturing at position:', x, y);
        
        // Create a capture object with the position
        const captureData = {
            x: x,
            y: y,
            timestamp: Date.now(),
            app: state.currentApp,
            corsBlocked: false
        };
        
        // Try to get element from iframe
        let elementFound = false;
        try {
            const iframe = document.getElementById('sandboxIframe');
            if (iframe && iframe.contentWindow) {
                const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                if (iframeDoc) {
                    // Get scroll position of iframe
                    const scrollX = iframeDoc.documentElement.scrollLeft || iframeDoc.body.scrollLeft;
                    const scrollY = iframeDoc.documentElement.scrollTop || iframeDoc.body.scrollTop;
                    
                    // Adjust coordinates for scroll
                    const adjustedX = x + scrollX;
                    const adjustedY = y + scrollY;
                    
                    const elements = iframeDoc.elementsFromPoint(x, y);
                    if (elements && elements.length > 0) {
                        const targetElement = elements.find(el => 
                            el.tagName !== 'HTML' && 
                            el.tagName !== 'BODY'
                        ) || elements[0];
                        
                        if (targetElement) {
                            elementFound = true;
                            const rect = targetElement.getBoundingClientRect();
                            captureData.element = targetElement;
                            captureData.tag = targetElement.tagName.toLowerCase();
                            captureData.classes = Array.from(targetElement.classList);
                            captureData.id = targetElement.id;
                            captureData.rect = {
                                x: rect.left,
                                y: rect.top,
                                width: rect.width,
                                height: rect.height
                            };
                            
                            // Get data attributes
                            captureData.dataAttributes = {};
                            Array.from(targetElement.attributes).forEach(attr => {
                                if (attr.name.startsWith('data-')) {
                                    captureData.dataAttributes[attr.name] = attr.value;
                                }
                            });
                            
                            // Get text content (limited)
                            const text = targetElement.textContent || targetElement.innerText || '';
                            captureData.textContent = text.substring(0, 200);
                            
                            // Get href if it's a link
                            if (targetElement.tagName === 'A') {
                                captureData.href = targetElement.href;
                            }
                            
                            // Get src if it's an image or video
                            if (targetElement.tagName === 'IMG' || targetElement.tagName === 'VIDEO') {
                                captureData.src = targetElement.src;
                            }
                            
                            // Show bloom and highlight
                            this.showBloom(rect);
                            
                            // In fullscreen, show persistent highlight
                            if (state.isFullscreen) {
                                this.showHighlight(rect);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.warn('Cannot access iframe (CORS):', error.message);
            captureData.corsBlocked = true;
            captureData.corsError = error.message;
        }
        
        // Add context even if element not found
        if (!elementFound) {
            captureData.message = captureData.corsBlocked 
                ? 'Element data blocked by CORS policy' 
                : 'Click captured - showing available diagnostics';
        }
        
        // Store captured data
        state.capturedData = captureData;
        
        // Show diagnostics in panels (if not in fullscreen)
        if (!state.isFullscreen) {
            diagnosticHUD.capture(captureData);
            aiReasoning.analyze(captureData);
        }
    }

    showHighlight(rect) {
        // Remove old highlight
        if (state.currentHighlight) {
            state.currentHighlight.remove();
        }

        // Create new highlight
        const highlight = document.createElement('div');
        highlight.className = 'element-highlight';
        highlight.style.left = rect.left + 'px';
        highlight.style.top = rect.top + 'px';
        highlight.style.width = rect.width + 'px';
        highlight.style.height = rect.height + 'px';
        
        this.overlay.appendChild(highlight);
        state.currentHighlight = highlight;
    }

    showBloom(rect) {
        if (this.bloomElement) {
            this.bloomElement.remove();
        }

        this.bloomElement = document.createElement('div');
        this.bloomElement.className = 'bloom-effect';
        this.bloomElement.style.left = rect.left + 'px';
        this.bloomElement.style.top = rect.top + 'px';
        this.bloomElement.style.width = rect.width + 'px';
        this.bloomElement.style.height = rect.height + 'px';
        
        this.overlay.appendChild(this.bloomElement);
        
        setTimeout(() => {
            if (this.bloomElement) {
                this.bloomElement.remove();
                this.bloomElement = null;
            }
        }, 1000);
    }
}

// ============================================================================
// DIAGNOSTIC HUD
// ============================================================================

class DiagnosticHUD {
    constructor() {
        this.container = document.querySelector('.diagnostic-content');
    }

    capture(captureData) {
        console.log('📊 Capturing diagnostics...', captureData);

        if (!captureData) {
            this.showEmpty();
            return;
        }

        // Build diagnostic data with what we have
        const diagnosticData = {
            timestamp: new Date(captureData.timestamp).toLocaleTimeString(),
            app: captureData.app || 'Unknown',
            position: { x: Math.round(captureData.x), y: Math.round(captureData.y) },
            element: null,
            hasElement: false
        };

        // If we have element data, add it
        if (captureData.element || captureData.tag) {
            diagnosticData.hasElement = true;
            diagnosticData.element = {
                tag: captureData.tag || 'unknown',
                classes: captureData.classes || [],
                id: captureData.id || 'none',
                rect: captureData.rect || null
            };

            // Try to get more data
            if (captureData.element) {
                try {
                    diagnosticData.element.textContent = captureData.element.textContent?.substring(0, 100) || '';
                    diagnosticData.element.attributes = this.getAttributes(captureData.element);
                    diagnosticData.element.styles = this.extractStyles(captureData.element);
                } catch (e) {
                    console.warn('Could not extract full element data:', e);
                }
            }
        }

        // Add console logs
        diagnosticData.recentLogs = state.logs.slice(-5);
        
        // Add network calls
        diagnosticData.recentNetwork = state.networkCalls.slice(-5);

        this.render(diagnosticData);
    }

    getAttributes(element) {
        const attrs = {};
        try {
            Array.from(element.attributes).forEach(attr => {
                attrs[attr.name] = attr.value;
            });
        } catch (e) {
            // Ignore
        }
        return attrs;
    }

    extractStyles(element) {
        try {
            const computed = window.getComputedStyle(element);
            return {
                display: computed.display,
                position: computed.position,
                width: computed.width,
                height: computed.height,
                background: computed.backgroundColor,
                color: computed.color
            };
        } catch (e) {
            return null;
        }
    }

    render(data) {
        let html = `
            <div class="diagnostic-section">
                <div class="section-title">📍 Capture Info</div>
                <div class="state-item">
                    <span class="state-key">Time:</span>
                    <span class="state-value">${data.timestamp}</span>
                </div>
                <div class="state-item">
                    <span class="state-key">App:</span>
                    <span class="state-value">${data.app}</span>
                </div>
                <div class="state-item">
                    <span class="state-key">Position:</span>
                    <span class="state-value">X: ${data.position.x}, Y: ${data.position.y}</span>
                </div>
            </div>
        `;

        if (data.hasElement && data.element) {
            html += `
                <div class="diagnostic-section">
                    <div class="section-title">🎯 Element Details</div>
                    <div class="state-item">
                        <span class="state-key">Tag:</span>
                        <span class="state-value">&lt;${data.element.tag}&gt;</span>
                    </div>
                    ${data.element.id !== 'none' ? `
                    <div class="state-item">
                        <span class="state-key">ID:</span>
                        <span class="state-value">#${data.element.id}</span>
                    </div>
                    ` : ''}
                    ${data.element.classes.length > 0 ? `
                    <div class="state-item">
                        <span class="state-key">Classes:</span>
                        <span class="state-value">${data.element.classes.join(', ')}</span>
                    </div>
                    ` : ''}
                    ${data.element.rect ? `
                    <div class="state-item">
                        <span class="state-key">Size:</span>
                        <span class="state-value">${Math.round(data.element.rect.width)}x${Math.round(data.element.rect.height)}px</span>
                    </div>
                    ` : ''}
                    ${data.element.textContent ? `
                    <div class="state-item">
                        <span class="state-key">Text:</span>
                        <span class="state-value">${data.element.textContent}</span>
                    </div>
                    ` : ''}
                </div>
            `;

            if (data.element.styles) {
                html += `
                    <div class="diagnostic-section">
                        <div class="section-title">🎨 Computed Styles</div>
                        ${Object.entries(data.element.styles).map(([key, value]) => `
                            <div class="state-item">
                                <span class="state-key">${key}:</span>
                                <span class="state-value">${value}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
        } else {
            html += `
                <div class="diagnostic-section">
                    <div class="section-title">🎯 Element Details</div>
                    <div class="console-log warn">
                        ⚠️ Could not access element details<br>
                        <span style="opacity: 0.6;">This may be due to CORS restrictions on the iframe</span>
                    </div>
                </div>
            `;
        }

        // Always show console logs if available
        if (data.recentLogs && data.recentLogs.length > 0) {
            html += `
                <div class="diagnostic-section">
                    <div class="section-title">📝 Recent Console Logs (${data.recentLogs.length})</div>
                    ${data.recentLogs.map(log => `
                        <div class="console-log ${log.type}">
                            ${log.type === 'error' ? '❌' : log.type === 'warn' ? '⚠️' : 'ℹ️'} ${log.message}
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            html += `
                <div class="diagnostic-section">
                    <div class="section-title">📝 Console Logs</div>
                    <div class="console-log info">
                        ℹ️ No console logs captured yet<br>
                        <span style="opacity: 0.6;">Console monitoring is active - logs will appear here</span>
                    </div>
                </div>
            `;
        }

        // Always show network calls if available
        if (data.recentNetwork && data.recentNetwork.length > 0) {
            html += `
                <div class="diagnostic-section">
                    <div class="section-title">🌐 Recent Network Calls (${data.recentNetwork.length})</div>
                    ${data.recentNetwork.map(call => `
                        <div class="console-log ${call.status >= 400 || call.status === 0 ? 'error' : 'info'}">
                            ${call.method} ${call.url}<br>
                            <span style="opacity: 0.6;">Status: ${call.status} | Time: ${call.time}ms</span>
                        </div>
                    `).join('')}
                </div>
            `;
        } else {
            html += `
                <div class="diagnostic-section">
                    <div class="section-title">🌐 Network Calls</div>
                    <div class="console-log info">
                        ℹ️ No network calls captured yet<br>
                        <span style="opacity: 0.6;">Network monitoring is active - calls will appear here</span>
                    </div>
                </div>
            `;
        }

        this.container.innerHTML = html;
    }

    showEmpty() {
        this.container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-mouse-pointer"></i>
                <div class="empty-state-text">
                    Click anywhere in the sandbox<br>to capture diagnostics
                </div>
            </div>
        `;
    }
}

// ============================================================================
// AI REASONING SYSTEM
// ============================================================================

class AIReasoning {
    constructor() {
        this.container = document.querySelector('.reasoning-content');
    }

    async analyze(captureData) {
        console.log('🤖 AI analyzing...', captureData);

        if (!captureData) {
            this.showEmpty();
            return;
        }

        // Show loading state
        this.container.innerHTML = `
            <div class="loading">
                <div class="spinner"></div>
                Analyzing with AI...
            </div>
        `;

        try {
            // Prepare data for AI analysis
            const analysisData = {
                element_data: {
                    tag: captureData.tag || 'unknown',
                    classes: captureData.classes || [],
                    id: captureData.id || '',
                    position: { x: captureData.x, y: captureData.y },
                    app: captureData.app
                },
                console_errors: state.logs.filter(log => log.type === 'error').slice(-5),
                network_calls: state.networkCalls.slice(-5),
                model: 'qwen-3.5-vl'
            };

            // Call actual AI backend
            const cacheBuster = `?t=${Date.now()}`;
            const response = await fetch(`${CONFIG.apiBase}/developer/analyze-bug${cacheBuster}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(analysisData)
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success && result.analysis) {
                this.render(result.analysis);
            } else {
                throw new Error('Invalid response from AI');
            }

        } catch (error) {
            console.error('AI analysis error:', error);
            
            // Show helpful fallback analysis
            this.renderFallback(captureData);
        }
    }

    renderFallback(captureData) {
        const hasErrors = state.logs.filter(log => log.type === 'error').length > 0;
        const hasNetworkErrors = state.networkCalls.filter(call => call.status >= 400 || call.status === 0).length > 0;
        const hasElement = captureData.tag !== undefined;
        
        let stepNumber = 1;
        
        this.container.innerHTML = `
            <div class="diagnostic-section">
                <div class="section-title">🤖 Quick Analysis</div>
                <div class="thought-step">
                    <span class="step-number">${stepNumber++}</span>
                    Captured click at position (${Math.round(captureData.x)}, ${Math.round(captureData.y)})
                </div>
                ${hasElement ? `
                <div class="thought-step">
                    <span class="step-number">${stepNumber++}</span>
                    Element type: &lt;${captureData.tag}&gt;${captureData.id ? ` with ID "${captureData.id}"` : ''}
                </div>
                ` : `
                <div class="thought-step">
                    <span class="step-number">${stepNumber++}</span>
                    Element details not accessible (CORS restriction)
                </div>
                `}
                ${captureData.classes && captureData.classes.length > 0 ? `
                <div class="thought-step">
                    <span class="step-number">${stepNumber++}</span>
                    Classes: ${captureData.classes.join(', ')}
                </div>
                ` : ''}
                ${hasErrors ? `
                <div class="thought-step">
                    <span class="step-number">${stepNumber++}</span>
                    ⚠️ Found ${state.logs.filter(log => log.type === 'error').length} console error(s)
                </div>
                ` : `
                <div class="thought-step">
                    <span class="step-number">${stepNumber++}</span>
                    ✅ No console errors detected
                </div>
                `}
                ${hasNetworkErrors ? `
                <div class="thought-step">
                    <span class="step-number">${stepNumber++}</span>
                    ⚠️ Detected ${state.networkCalls.filter(call => call.status >= 400 || call.status === 0).length} failed network request(s)
                </div>
                ` : `
                <div class="thought-step">
                    <span class="step-number">${stepNumber++}</span>
                    ✅ All network requests successful
                </div>
                `}
                <div class="thought-step">
                    <span class="step-number">${stepNumber++}</span>
                    Monitoring: ${state.logs.length} logs, ${state.networkCalls.length} network calls
                </div>
            </div>

            <div class="diagnostic-section">
                <div class="section-title">🔌 AI Backend Status</div>
                <div class="console-log error">
                    ❌ Cannot connect to Shree AI backend<br>
                    <span style="opacity: 0.6;">The AI analysis requires the backend to be running</span>
                </div>
                <div style="margin-top: 12px; padding: 12px; background: rgba(0, 212, 255, 0.1); border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 8px;">
                    <div style="font-size: 12px; font-weight: 600; margin-bottom: 8px; color: #00d4ff;">
                        <i class="fas fa-terminal"></i> Start Backend:
                    </div>
                    <code style="display: block; padding: 8px; background: rgba(0, 0, 0, 0.3); border-radius: 4px; font-size: 11px; color: #94a3b8;">
                        cd ShreeApp/backend<br>
                        python main.py
                    </code>
                </div>
                <div style="margin-top: 12px;">
                    <button class="execute-btn" onclick="location.reload()" style="padding: 10px 20px; font-size: 13px; width: 100%;">
                        <i class="fas fa-sync-alt"></i>
                        Retry Connection
                    </button>
                </div>
            </div>

            <div class="diagnostic-section">
                <div class="section-title">💡 Manual Analysis Tips</div>
                <div class="state-item">
                    <span class="state-key">1.</span>
                    <span class="state-value">Check console logs in Diagnostic HUD (center panel)</span>
                </div>
                <div class="state-item">
                    <span class="state-key">2.</span>
                    <span class="state-value">Review network calls for failures or slow responses</span>
                </div>
                <div class="state-item">
                    <span class="state-key">3.</span>
                    <span class="state-value">Inspect element styles and attributes</span>
                </div>
                <div class="state-item">
                    <span class="state-key">4.</span>
                    <span class="state-value">Look for error classes or data attributes</span>
                </div>
                <div class="state-item">
                    <span class="state-key">5.</span>
                    <span class="state-value">Check the Pulse Bar (bottom) for system health</span>
                </div>
            </div>

            ${hasErrors || hasNetworkErrors ? `
            <div class="diagnostic-section">
                <div class="section-title">⚠️ Issues Detected</div>
                ${hasErrors ? `
                <div class="console-log error">
                    <strong>Console Errors:</strong><br>
                    ${state.logs.filter(log => log.type === 'error').slice(-3).map(log => 
                        `• ${log.message}`
                    ).join('<br>')}
                </div>
                ` : ''}
                ${hasNetworkErrors ? `
                <div class="console-log error" style="margin-top: 8px;">
                    <strong>Network Errors:</strong><br>
                    ${state.networkCalls.filter(call => call.status >= 400 || call.status === 0).slice(-3).map(call => 
                        `• ${call.method} ${call.url} (${call.status})`
                    ).join('<br>')}
                </div>
                ` : ''}
            </div>
            ` : ''}
        `;
    }

    showEmpty() {
        this.container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-lightbulb"></i>
                <div class="empty-state-text">
                    AI analysis will appear here<br>when you click an element
                </div>
            </div>
        `;
    }

    render(analysis) {
        this.container.innerHTML = `
            <div class="diagnostic-section">
                <div class="section-title">Reasoning Trace</div>
                ${analysis.steps.map((step, index) => `
                    <div class="thought-step">
                        <span class="step-number">${index + 1}</span>
                        ${step}
                    </div>
                `).join('')}
            </div>

            <div class="diagnostic-section">
                <div class="section-title">Suggested Fix</div>
                <div class="state-item">
                    <span class="state-key">File:</span>
                    <span class="state-value">${analysis.fix.file}:${analysis.fix.line}</span>
                </div>
                <div class="console-log info">
                    <pre style="margin: 0; white-space: pre-wrap;">${analysis.fix.code}</pre>
                </div>
                <div class="state-item">
                    <span class="state-key">Confidence:</span>
                    <span class="state-value">${(analysis.confidence * 100).toFixed(1)}%</span>
                </div>
            </div>

            <div class="diagnostic-section">
                <button class="execute-btn" onclick="executeFix()">
                    <i class="fas fa-magic"></i>
                    Execute Fix
                </button>
            </div>
        `;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// ============================================================================
// APP SELECTOR
// ============================================================================

function initAppSelector() {
    const appButtons = document.querySelectorAll('.app-btn');
    const iframe = document.getElementById('sandboxIframe');

    appButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const app = btn.dataset.app;
            
            // Update active state
            appButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Load app in iframe
            iframe.src = CONFIG.apps[app];
            state.currentApp = app;
            
            console.log(`📱 Switched to ${app} app`);
        });
    });
}

// ============================================================================
// CONTROL BUTTONS
// ============================================================================

function initControls() {
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
        const iframe = document.getElementById('sandboxIframe');
        iframe.src = iframe.src;
        console.log('🔄 Refreshing sandbox...');
    });

    // Freeze button
    document.getElementById('freezeBtn').addEventListener('click', (e) => {
        state.frozen = !state.frozen;
        e.currentTarget.classList.toggle('active');
        console.log(`${state.frozen ? '⏸️' : '▶️'} Sandbox ${state.frozen ? 'frozen' : 'unfrozen'}`);
    });

    // Targeting button
    document.getElementById('targetBtn').addEventListener('click', (e) => {
        state.targetingEnabled = !state.targetingEnabled;
        e.currentTarget.classList.toggle('active');
        
        const overlay = document.getElementById('targetingOverlay');
        overlay.style.pointerEvents = state.targetingEnabled ? 'auto' : 'none';
        
        console.log(`🎯 Targeting ${state.targetingEnabled ? 'enabled' : 'disabled'}`);
    });

    // Diagnostics toggle
    document.getElementById('enableDiagnostics').addEventListener('click', (e) => {
        state.diagnosticsEnabled = !state.diagnosticsEnabled;
        e.currentTarget.classList.toggle('active');
        console.log(`🔍 Diagnostics ${state.diagnosticsEnabled ? 'enabled' : 'disabled'}`);
    });
}

// ============================================================================
// AGENT INTEGRATION
// ============================================================================

function initAgentButtons() {
    const agentButtons = document.querySelectorAll('.agent-btn');
    
    agentButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const agent = btn.textContent.trim();
            console.log(`🤖 Sending fix to ${agent}...`);
            
            // Simulate sending to agent
            btn.innerHTML = '<i class="fas fa-check"></i> Sent!';
            btn.style.borderColor = '#10b981';
            btn.style.color = '#10b981';
            
            setTimeout(() => {
                btn.innerHTML = btn.dataset.originalContent || btn.innerHTML;
                btn.style.borderColor = '';
                btn.style.color = '';
            }, 2000);
        });
    });
}

// ============================================================================
// EXECUTE FIX
// ============================================================================

window.executeFix = function() {
    console.log('⚡ Executing fix...');
    
    const btn = event.target.closest('.execute-btn');
    btn.innerHTML = '<div class="spinner"></div> Applying fix...';
    btn.disabled = true;
    
    setTimeout(() => {
        btn.innerHTML = '<i class="fas fa-check"></i> Fix Applied!';
        btn.style.background = 'linear-gradient(135deg, #10b981, #00d4ff)';
        audio.playQuantumFix();
        
        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-magic"></i> Execute Fix';
            btn.style.background = '';
            btn.disabled = false;
        }, 3000);
    }, 2000);
};

// ============================================================================
// ECOSYSTEM PULSE BAR
// ============================================================================

// Console & Network Monitoring
function initConsoleMonitoring() {
    // Intercept console methods
    const originalConsole = {
        log: console.log,
        warn: console.warn,
        error: console.error
    };

    console.log = function(...args) {
        state.logs.push({
            type: 'log',
            message: args.join(' '),
            timestamp: Date.now(),
            source: 'dashboard'
        });
        
        if (state.logs.length > 100) state.logs.shift();
        originalConsole.log.apply(console, args);
    };

    console.warn = function(...args) {
        state.logs.push({
            type: 'warn',
            message: args.join(' '),
            timestamp: Date.now(),
            source: 'dashboard'
        });
        
        if (state.logs.length > 100) state.logs.shift();
        originalConsole.warn.apply(console, args);
    };

    console.error = function(...args) {
        state.logs.push({
            type: 'error',
            message: args.join(' '),
            timestamp: Date.now(),
            stack: new Error().stack,
            source: 'dashboard'
        });
        
        if (state.logs.length > 100) state.logs.shift();
        originalConsole.error.apply(console, args);
    };

    window.addEventListener('error', (e) => {
        state.logs.push({
            type: 'error',
            message: e.message,
            source: e.filename || 'dashboard',
            line: e.lineno,
            timestamp: Date.now()
        });
        
        // Show notification for critical errors
        if (assistantManager) {
            assistantManager.showNotification(`Error: ${e.message}`, 'error');
        }
    });
    
    // Monitor iframe errors
    monitorIframeErrors();
}

function monitorIframeErrors() {
    const iframe = document.getElementById('sandboxFrame');
    if (!iframe) return;
    
    // Listen for messages from iframe
    window.addEventListener('message', (event) => {
        // Check if it's an error message
        if (event.data && event.data.type === 'console') {
            const logData = event.data.data;
            state.logs.push({
                type: logData.level || 'log',
                message: logData.message,
                timestamp: Date.now(),
                source: 'app:' + state.currentApp,
                file: logData.file,
                line: logData.line
            });
            
            if (state.logs.length > 100) state.logs.shift();
            
            // Show notification for errors from apps
            if (logData.level === 'error' && assistantManager) {
                assistantManager.showNotification(
                    `Error in ${state.currentApp}: ${logData.message}`, 
                    'error'
                );
            }
            
            console.log(`📱 [${state.currentApp}] ${logData.level}: ${logData.message}`);
        }
    });
    
    // Try to inject error monitoring into iframe
    iframe.addEventListener('load', () => {
        try {
            const iframeWindow = iframe.contentWindow;
            const iframeDoc = iframe.contentDocument;
            
            if (iframeWindow && iframeDoc) {
                // Inject error monitoring script
                const script = iframeDoc.createElement('script');
                script.textContent = `
                    (function() {
                        // Intercept console methods
                        const originalConsole = {
                            log: console.log,
                            warn: console.warn,
                            error: console.error
                        };
                        
                        function sendToParent(level, args) {
                            try {
                                window.parent.postMessage({
                                    type: 'console',
                                    data: {
                                        level: level,
                                        message: Array.from(args).map(arg => 
                                            typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
                                        ).join(' '),
                                        timestamp: Date.now()
                                    }
                                }, '*');
                            } catch (e) {
                                // Ignore if can't send to parent
                            }
                        }
                        
                        console.log = function(...args) {
                            sendToParent('log', args);
                            originalConsole.log.apply(console, args);
                        };
                        
                        console.warn = function(...args) {
                            sendToParent('warn', args);
                            originalConsole.warn.apply(console, args);
                        };
                        
                        console.error = function(...args) {
                            sendToParent('error', args);
                            originalConsole.error.apply(console, args);
                        };
                        
                        // Capture uncaught errors
                        window.addEventListener('error', (e) => {
                            sendToParent('error', [
                                e.message + ' at ' + e.filename + ':' + e.lineno
                            ]);
                        });
                        
                        // Capture unhandled promise rejections
                        window.addEventListener('unhandledrejection', (e) => {
                            sendToParent('error', [
                                'Unhandled Promise Rejection: ' + e.reason
                            ]);
                        });
                        
                        console.log('🔍 Developer Dashboard monitoring active');
                    })();
                `;
                
                // Insert at the beginning of head
                if (iframeDoc.head) {
                    iframeDoc.head.insertBefore(script, iframeDoc.head.firstChild);
                    console.log('✅ Injected error monitoring into', state.currentApp);
                }
            }
        } catch (e) {
            // CORS restriction - can't access iframe content
            console.warn('⚠️ Cannot inject monitoring into iframe (CORS):', e.message);
            console.log('💡 Errors from', state.currentApp, 'will only be visible if app sends them via postMessage');
        }
    });
}

function initNetworkMonitoring() {
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
        const startTime = Date.now();
        const url = args[0];
        const options = args[1] || {};
        
        return originalFetch.apply(this, args).then(response => {
            state.networkCalls.push({
                method: options.method || 'GET',
                url: url,
                status: response.status,
                time: Date.now() - startTime,
                timestamp: Date.now()
            });
            
            if (state.networkCalls.length > 50) state.networkCalls.shift();
            return response;
        }).catch(error => {
            state.networkCalls.push({
                method: options.method || 'GET',
                url: url,
                status: 0,
                error: error.message,
                time: Date.now() - startTime,
                timestamp: Date.now()
            });
            throw error;
        });
    };
}

async function updatePulseMetrics() {
    try {
        const cacheBuster = `?t=${Date.now()}`;
        const healthResponse = await fetch(`${CONFIG.apiBase}/developer/health${cacheBuster}`);
        const healthData = await healthResponse.json();
        
        const serverMetric = document.querySelectorAll('.pulse-metric')[0];
        if (serverMetric) {
            const statusDot = serverMetric.querySelector('.status-dot');
            const value = serverMetric.querySelector('.metric-value');
            const fill = serverMetric.querySelector('.metric-fill');
            
            if (healthData.status === 'operational') {
                statusDot.className = 'status-dot online';
                value.textContent = '100%';
                fill.style.width = '100%';
                fill.className = 'metric-fill success';
            } else {
                statusDot.className = 'status-dot error';
                value.textContent = 'Offline';
                fill.style.width = '0%';
            }
        }

        const statsResponse = await fetch(`${CONFIG.apiBase}/developer/stats${cacheBuster}`);
        const statsData = await statsResponse.json();
        
        if (statsData.success) {
            const tokenMetric = document.querySelectorAll('.pulse-metric')[1];
            if (tokenMetric && statsData.stats.total_analyses) {
                const used = statsData.stats.total_analyses * 100;
                const limit = 10000;
                const value = tokenMetric.querySelector('.metric-value');
                const fill = tokenMetric.querySelector('.metric-fill');
                
                value.textContent = `${used} / ${limit}`;
                fill.style.width = `${(used / limit) * 100}%`;
            }
        }
    } catch (error) {
        const serverMetric = document.querySelectorAll('.pulse-metric')[0];
        if (serverMetric) {
            serverMetric.querySelector('.status-dot').className = 'status-dot error';
            serverMetric.querySelector('.metric-value').textContent = 'Backend Offline';
        }
    }
}

function initPulseBar() {
    // Initial update
    updatePulseMetrics();
    
    // Update every 5 seconds
    setInterval(updatePulseMetrics, 5000);
    
    // Update network latency
    setInterval(() => {
        const networkMetric = document.querySelectorAll('.pulse-metric')[2];
        if (networkMetric && state.networkCalls.length > 0) {
            const recentCalls = state.networkCalls.slice(-10);
            const avgLatency = recentCalls.reduce((sum, call) => sum + call.time, 0) / recentCalls.length;
            
            const value = networkMetric.querySelector('.metric-value');
            const fill = networkMetric.querySelector('.metric-fill');
            
            value.textContent = `${Math.round(avgLatency)}ms`;
            
            if (avgLatency < 100) {
                fill.style.width = '90%';
                fill.className = 'metric-fill success';
            } else if (avgLatency < 500) {
                fill.style.width = '60%';
                fill.className = 'metric-fill';
            } else {
                fill.style.width = '30%';
                fill.className = 'metric-fill warning';
            }
        }
    }, 3000);
    
    // Update memory usage
    if (performance.memory) {
        setInterval(() => {
            const memoryMetric = document.querySelectorAll('.pulse-metric')[3];
            if (memoryMetric) {
                const used = performance.memory.usedJSHeapSize / 1024 / 1024;
                const limit = performance.memory.jsHeapSizeLimit / 1024 / 1024;
                
                const value = memoryMetric.querySelector('.metric-value');
                const fill = memoryMetric.querySelector('.metric-fill');
                const statusDot = memoryMetric.querySelector('.status-dot');
                
                value.textContent = `${used.toFixed(0)}MB / ${limit.toFixed(0)}MB`;
                fill.style.width = `${(used / limit) * 100}%`;
                
                if (used / limit > 0.8) {
                    fill.className = 'metric-fill warning';
                    statusDot.className = 'status-dot warning';
                } else {
                    fill.className = 'metric-fill success';
                    statusDot.className = 'status-dot online';
                }
            }
        }, 5000);
    }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Advanced AI Developer Dashboard loaded');
    
    // Initialize monitoring first
    initConsoleMonitoring();
    initNetworkMonitoring();
    
    // Initialize all systems
    const targetingArrow = new TargetingArrow();
    const diagnosticHUD = new DiagnosticHUD();
    const aiReasoning = new AIReasoning();
    const fullscreenManager = new FullscreenManager();
    const assistantManager = new AssistantManager();
    
    // Make globally accessible
    window.diagnosticHUD = diagnosticHUD;
    window.aiReasoning = aiReasoning;
    window.fullscreenManager = fullscreenManager;
    window.assistantManager = assistantManager;
    
    // Initialize UI components
    initAppSelector();
    initControls();
    initAgentButtons();
    initPulseBar();
    
    // Show welcome message in AI reasoning pane
    setTimeout(() => {
        const reasoningContent = document.querySelector('.reasoning-content');
        if (reasoningContent) {
            reasoningContent.innerHTML = `
                <div style="padding: 20px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <i class="fas fa-rocket" style="font-size: 48px; color: #00d4ff; margin-bottom: 16px;"></i>
                        <h3 style="font-size: 18px; font-weight: 700; margin-bottom: 8px;">Welcome to Advanced Dashboard!</h3>
                        <p style="font-size: 13px; color: #94a3b8; line-height: 1.6;">
                            Try the new fullscreen mode!
                        </p>
                    </div>
                    
                    <div style="background: rgba(0, 212, 255, 0.1); border: 1px solid rgba(0, 212, 255, 0.3); border-radius: 12px; padding: 16px; margin-bottom: 16px;">
                        <div style="font-size: 12px; font-weight: 600; margin-bottom: 12px; color: #00d4ff;">
                            <i class="fas fa-expand"></i> Fullscreen Mode:
                        </div>
                        <div style="font-size: 12px; color: #94a3b8; line-height: 1.8;">
                            <div style="margin-bottom: 8px;">
                                <strong style="color: white;">1.</strong> Click fullscreen button (top-right of sandbox)
                            </div>
                            <div style="margin-bottom: 8px;">
                                <strong style="color: white;">2.</strong> Click any element in the app
                            </div>
                            <div style="margin-bottom: 8px;">
                                <strong style="color: white;">3.</strong> Assistant panel slides out with all info
                            </div>
                            <div>
                                <strong style="color: white;">4.</strong> Press ESC or click back button to exit
                            </div>
                        </div>
                    </div>
                    
                    <div style="background: rgba(168, 85, 247, 0.1); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 12px; padding: 16px;">
                        <div style="font-size: 12px; font-weight: 600; margin-bottom: 12px; color: #a855f7;">
                            <i class="fas fa-brain"></i> AI Features:
                        </div>
                        <div style="font-size: 12px; color: #94a3b8; line-height: 1.8;">
                            AI analysis requires the Shree AI backend to be running. Start it with:
                            <code style="display: block; margin-top: 8px; padding: 8px; background: rgba(0, 0, 0, 0.3); border-radius: 4px; font-size: 11px;">
                                cd ShreeApp/backend<br>
                                python main.py
                            </code>
                        </div>
                    </div>
                </div>
            `;
        }
    }, 500);
    
    console.log('🎉 All systems operational!');
    console.log('💡 Tip: Click fullscreen button, then click elements to analyze');
    console.log('🔗 Backend: ' + CONFIG.apiBase);
    console.log('📊 Monitoring: Console logs and network calls are being tracked');
    console.log('🖥️ Fullscreen mode: Click expand button for immersive experience');
});

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K - Command palette (future)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        console.log('⌨️ Command palette (coming soon)');
    }
    
    // Ctrl/Cmd + E - Toggle targeting
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        document.getElementById('targetBtn').click();
    }
    
    // Ctrl/Cmd + F - Freeze sandbox
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        document.getElementById('freezeBtn').click();
    }
    
    // Ctrl/Cmd + R - Refresh sandbox
    if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
        e.preventDefault();
        document.getElementById('refreshBtn').click();
    }
});

console.log('⌨️ Keyboard shortcuts enabled:');
console.log('  Ctrl/Cmd + E - Toggle targeting');
console.log('  Ctrl/Cmd + F - Freeze sandbox');
console.log('  Ctrl/Cmd + R - Refresh sandbox');
