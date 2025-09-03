// TechTools OCR System
// Client-side screenshot processing using Tesseract.js for measurement extraction
// Enhanced for utility pole field photos with better preprocessing

(function() {
    
    // ==========================================
    // OCR CORE FUNCTIONALITY
    // ==========================================
    
    window.OCRSystem = {
        // Tesseract worker instance (lazy loaded)
        worker: null,
        
        // Initialize OCR worker with settings optimized for utility field photos
        async initWorker() {
            if (!this.worker && typeof Tesseract !== 'undefined') {
                try {
                    console.log('Initializing OCR worker for utility photos...');
                    this.worker = await Tesseract.createWorker('eng');
                    await this.worker.setParameters({
                        tessedit_char_whitelist: '0123456789.\'"- ftinFTINchesabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
                        tessedit_pageseg_mode: '11', // Sparse text - good for annotations on photos
                        preserve_interword_spaces: '1',
                        tessedit_do_invert: '1'
                    });
                    console.log('OCR Worker initialized for utility field photos');
                } catch (error) {
                    console.error('Failed to initialize OCR worker:', error);
                    throw new Error('OCR system unavailable - Tesseract.js failed to load');
                }
            } else if (typeof Tesseract === 'undefined') {
                throw new Error('OCR system unavailable - Tesseract.js not loaded');
            }
            return this.worker;
        },
        
        // Main function to extract measurements from image with enhanced preprocessing
        async extractMeasurements(imageFile, progressCallback) {
            try {
                const worker = await this.initWorker();
                
                // Validate file
                if (!imageFile || !imageFile.type.startsWith('image/')) {
                    throw new Error('Invalid image file');
                }
                
                if (imageFile.size > 10 * 1024 * 1024) {
                    throw new Error('Image file too large (max 10MB)');
                }
                
                // Update progress
                progressCallback('Preparing image for utility OCR...', 10);
                
                // Enhanced preprocessing for utility field photos
                const preprocessedImages = await this.preprocessUtilityImage(imageFile);
                progressCallback('Analyzing annotations...', 30);
                
                // Try multiple preprocessing approaches
                let bestResult = null;
                let bestConfidence = 0;
                
                for (let i = 0; i < preprocessedImages.length; i++) {
                    progressCallback(`Reading text (attempt ${i + 1}/${preprocessedImages.length})...`, 40 + (i * 30));
                    
                    try {
                        const { data: { text, confidence } } = await worker.recognize(preprocessedImages[i]);
                        
                        if (confidence > bestConfidence || !bestResult) {
                            bestResult = text;
                            bestConfidence = confidence;
                        }
                    } catch (error) {
                        console.warn(`OCR attempt ${i + 1} failed:`, error);
                    }
                }
                
                if (!bestResult) {
                    throw new Error('OCR failed on all preprocessing attempts');
                }
                
                progressCallback('Parsing utility measurements...', 85);
                
                // Parse measurements with utility-specific logic
                const measurements = this.parseUtilityMeasurements(bestResult);
                progressCallback('Complete!', 100);
                
                console.log('Utility OCR Results:', { 
                    text: bestResult, 
                    confidence: bestConfidence, 
                    measurements: measurements.length 
                });
                
                return { 
                    success: true, 
                    measurements: measurements.slice(0, 8), // Limit results
                    rawText: bestResult, 
                    confidence: Math.round(bestConfidence)
                };
                
            } catch (error) {
                console.error('Utility OCR extraction failed:', error);
                return { 
                    success: false, 
                    error: error.message,
                    details: error
                };
            }
        },
        
        // Enhanced preprocessing specifically for utility pole photos
        async preprocessUtilityImage(imageFile) {
            return new Promise((resolve) => {
                const img = new Image();
                
                img.onload = () => {
                    try {
                        const preprocessedImages = [];
                        
                        // Create multiple preprocessing variations for better OCR
                        const variations = [
                            // High contrast for annotations
                            { contrast: 2.0, brightness: 1.2, saturate: 0, blur: 0 },
                            // Enhanced text clarity
                            { contrast: 1.8, brightness: 1.3, saturate: 0, blur: 0.5 },
                            // Inverted for white text on dark backgrounds
                            { contrast: 1.5, brightness: 0.8, saturate: 0, invert: true }
                        ];
                        
                        variations.forEach((variation, idx) => {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            
                            // Calculate optimal size (higher resolution for text clarity)
                            const targetWidth = 1600; // Higher resolution for better text recognition
                            const scale = Math.min(3, Math.max(1.5, targetWidth / img.width));
                            
                            canvas.width = img.width * scale;
                            canvas.height = img.height * scale;
                            
                            // Apply preprocessing filter
                            let filterString = `contrast(${variation.contrast}) brightness(${variation.brightness}) saturate(${variation.saturate})`;
                            if (variation.blur) filterString += ` blur(${variation.blur}px)`;
                            if (variation.invert) filterString += ` invert(1)`;
                            
                            ctx.imageSmoothingEnabled = true;
                            ctx.imageSmoothingQuality = 'high';
                            ctx.filter = filterString;
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                            
                            // Additional post-processing for text clarity
                            if (idx === 0) {
                                // Apply edge enhancement for the first variant
                                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                                const data = imageData.data;
                                
                                // Simple edge enhancement
                                for (let i = 0; i < data.length; i += 4) {
                                    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                                    data[i] = data[i + 1] = data[i + 2] = gray > 128 ? 255 : 0; // High contrast
                                }
                                
                                ctx.putImageData(imageData, 0, 0);
                            }
                            
                            preprocessedImages.push(canvas);
                        });
                        
                        resolve(preprocessedImages);
                    } catch (error) {
                        console.error('Utility image preprocessing failed:', error);
                        // Fallback to original image
                        resolve([img]);
                    }
                };
                
                img.onerror = () => {
                    console.error('Failed to load image for utility preprocessing');
                    resolve([]);
                };
                
                img.src = URL.createObjectURL(imageFile);
            });
        },
        
        // Enhanced parsing specifically for utility pole measurements
        parseUtilityMeasurements(text) {
            if (!text || typeof text !== 'string') {
                return [];
            }
            
            console.log('Parsing utility measurements from OCR text...');
            
            const measurements = [];
            const processedValues = new Set();
            
            // Enhanced patterns for utility field annotations
            const utilityPatterns = [
                // Complete measurements with apostrophes and quotes
                /(\d{1,2})['′]\s*[-–—]?\s*(\d{1,2})["″]/gi,                     // 30'9", 26'3"
                /(\d{1,2})\s*['′]\s*[-–—]?\s*(\d{1,2})\s*["″]/gi,              // 30 ' - 9 "
                
                // Dash format measurements  
                /(\d{1,2})\s*[-–—]\s*(\d{1,2})/gi,                              // 30-9, 26-3
                
                // Space separated with units
                /(\d{1,2})\s*ft\s*(\d{1,2})\s*in/gi,                           // 30 ft 9 in
                /(\d{1,2})\s*feet\s*(\d{1,2})\s*inch/gi,                      // 30 feet 9 inch
                
                // Concatenated numbers (common OCR misreading)
                /(\d)(\d)(\d)/g,                                                // 309 -> 30'9"
                
                // With context words
                /height[:\s]*(\d{1,2})['′]?\s*[-–—]?\s*(\d{1,2})["″]?/gi,      // height: 30'9"
                /(\d{1,2})['′]?\s*[-–—]?\s*(\d{1,2})["″]?\s*(?:high|height|ft|feet)/gi, // 30'9" high
                
                // Decimal feet format
                /(\d{1,2})\.\s*(\d{1,2})\s*['′]?/gi,                          // 30.9' 
                
                // Quote variations
                /(\d{1,2})\s*[''']\s*(\d{1,2})\s*[""″"]/gi                    // Various quote chars
            ];
            
            utilityPatterns.forEach((pattern, patternIdx) => {
                let match;
                const regex = new RegExp(pattern.source, pattern.flags);
                
                while ((match = regex.exec(text)) !== null) {
                    try {
                        let feet = 0, inches = 0;
                        
                        if (patternIdx === 4) { // Concatenated numbers like "309"
                            if (match[0].length === 3) {
                                const digit1 = parseInt(match[1]);
                                const digit2 = parseInt(match[2]); 
                                const digit3 = parseInt(match[3]);
                                
                                // Try different interpretations
                                if (digit1 >= 1 && digit1 <= 5) {
                                    // 309 -> 30'9"
                                    feet = digit1 * 10 + digit2;
                                    inches = digit3;
                                } else {
                                    continue; // Skip invalid combinations
                                }
                            } else {
                                continue;
                            }
                        } else if (patternIdx === 7) { // Decimal feet
                            const decimalFeet = parseFloat(match[1] + '.' + match[2]);
                            feet = Math.floor(decimalFeet);
                            inches = Math.round((decimalFeet - feet) * 12);
                        } else {
                            // Standard two-number patterns
                            feet = parseInt(match[1]) || 0;
                            inches = parseInt(match[2]) || 0;
                        }
                        
                        // Validate reasonable utility pole measurements
                        if (feet >= 8 && feet <= 60 && inches >= 0 && inches < 12) {
                            const totalInches = feet * 12 + inches;
                            const key = `${feet}-${inches}`;
                            
                            // Avoid duplicates
                            if (!processedValues.has(key)) {
                                processedValues.add(key);
                                
                                // Enhanced confidence calculation for utility context
                                const confidence = this.calculateUtilityConfidence(match[0], text, totalInches, patternIdx);
                                
                                measurements.push({
                                    original: match[0].trim(),
                                    feet,
                                    inches,
                                    formatted: `${feet}-${inches}`,
                                    totalInches,
                                    confidence,
                                    patternType: this.getPatternType(patternIdx),
                                    context: this.getUtilityContext(match[0], text)
                                });
                            }
                        }
                    } catch (error) {
                        console.warn('Failed to parse utility measurement:', match[0], error);
                    }
                }
            });
            
            // Sort by confidence and utility relevance
            return measurements
                .sort((a, b) => {
                    // Prefer measurements in utility ranges
                    const aUtilityRange = (a.totalInches >= 144 && a.totalInches <= 600); // 12-50 feet
                    const bUtilityRange = (b.totalInches >= 144 && b.totalInches <= 600);
                    
                    if (aUtilityRange !== bUtilityRange) {
                        return bUtilityRange ? 1 : -1;
                    }
                    
                    return b.confidence - a.confidence;
                })
                .slice(0, 6); // Top 6 results
        },
        
        // Get pattern type description
        getPatternType(patternIdx) {
            const types = [
                'Traditional (30\'9")',
                'Traditional with spaces',
                'Dash format (30-9)',
                'Feet/inches (30 ft 9 in)',
                'Concatenated (309)',
                'With context (height: 30\'9")',
                'Decimal feet (30.9)',
                'Quote variations'
            ];
            return types[patternIdx] || 'Unknown';
        },
        
        // Extract utility context around measurement
        getUtilityContext(measurementText, fullText) {
            const index = fullText.indexOf(measurementText);
            if (index === -1) return 'Unknown context';
            
            const start = Math.max(0, index - 40);
            const end = Math.min(fullText.length, index + measurementText.length + 40);
            const context = fullText.substring(start, end).trim();
            
            // Check for utility keywords
            const powerKeywords = ['power', 'electric', 'energy', 'neutral', 'supply', 'kv'];
            const commKeywords = ['spectrum', 'comm', 'fiber', 'cable', 'internet', 'phone'];
            
            const contextLower = context.toLowerCase();
            const isPower = powerKeywords.some(keyword => contextLower.includes(keyword));
            const isComm = commKeywords.some(keyword => contextLower.includes(keyword));
            
            return {
                text: context,
                isPower,
                isComm,
                type: isPower ? 'Power' : isComm ? 'Communication' : 'Unknown'
            };
        },
        
        // Enhanced confidence calculation for utility measurements
        calculateUtilityConfidence(originalText, fullText, totalInches, patternIdx) {
            let confidence = 60; // Higher base for utility context
            
            // Pattern-specific bonuses
            const patternBonuses = [25, 20, 15, 10, 5, 20, 15, 10]; // Indexed bonuses
            confidence += patternBonuses[patternIdx] || 0;
            
            // Utility-specific validation
            const feet = totalInches / 12;
            if (feet >= 12 && feet <= 50) confidence += 25; // Typical utility range
            if (feet >= 20 && feet <= 35) confidence += 15; // Sweet spot for most attachments
            
            // Text quality indicators
            if (originalText.length >= 3 && originalText.length <= 8) confidence += 15;
            if (originalText.match(/^\d{2}[-']?\d{1,2}[""]?$/)) confidence += 20; // Clean utility format
            
            // Context bonuses
            const context = this.getUtilityContext(originalText, fullText);
            if (context.isPower || context.isComm) confidence += 20;
            
            // Penalize problematic patterns
            if (originalText.length > 12) confidence -= 25;
            if (feet < 8 || feet > 60) confidence -= 30; // Outside utility range
            if (!originalText.match(/\d/)) confidence = 0;
            
            return Math.max(0, Math.min(100, confidence));
        },
        
        // Preprocess image with multiple techniques for utility field photos
        async preprocessUtilityImage(imageFile) {
            return new Promise((resolve) => {
                const img = new Image();
                
                img.onload = () => {
                    try {
                        const processedImages = [];
                        
                        // Create multiple preprocessing approaches for utility annotations
                        const techniques = [
                            {
                                name: 'High Contrast',
                                contrast: 3.0,
                                brightness: 1.3,
                                saturate: 0,
                                scale: 2.5
                            },
                            {
                                name: 'Text Enhancement',
                                contrast: 2.5,
                                brightness: 1.1,
                                saturate: 0,
                                scale: 2.0,
                                sharpen: true
                            },
                            {
                                name: 'Annotation Focus',
                                contrast: 1.8,
                                brightness: 1.4,
                                saturate: 0,
                                scale: 3.0,
                                threshold: 0.6
                            }
                        ];
                        
                        techniques.forEach(technique => {
                            const canvas = document.createElement('canvas');
                            const ctx = canvas.getContext('2d');
                            
                            // Calculate size
                            const scale = technique.scale;
                            canvas.width = img.width * scale;
                            canvas.height = img.height * scale;
                            
                            // Apply initial filter
                            ctx.imageSmoothingEnabled = true;
                            ctx.imageSmoothingQuality = 'high';
                            ctx.filter = `contrast(${technique.contrast}) brightness(${technique.brightness}) saturate(${technique.saturate})`;
                            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                            
                            // Additional processing
                            if (technique.threshold) {
                                // Apply threshold for high contrast text
                                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                                const data = imageData.data;
                                
                                for (let i = 0; i < data.length; i += 4) {
                                    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                                    const value = gray > (technique.threshold * 255) ? 255 : 0;
                                    data[i] = data[i + 1] = data[i + 2] = value;
                                }
                                
                                ctx.putImageData(imageData, 0, 0);
                            }
                            
                            if (technique.sharpen) {
                                // Apply unsharp mask for text clarity
                                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                                // Simple sharpening kernel
                                const sharpenedData = this.applySharpenFilter(imageData);
                                ctx.putImageData(sharpenedData, 0, 0);
                            }
                            
                            processedImages.push(canvas);
                        });
                        
                        resolve(processedImages);
                    } catch (error) {
                        console.error('Utility image preprocessing failed:', error);
                        resolve([img]); // Fallback
                    }
                };
                
                img.onerror = () => {
                    console.error('Failed to load utility image');
                    resolve([]);
                };
                
                img.src = URL.createObjectURL(imageFile);
            });
        },
        
        // Simple sharpening filter for text clarity
        applySharpenFilter(imageData) {
            const data = imageData.data;
            const width = imageData.width;
            const height = imageData.height;
            const result = new ImageData(width, height);
            const resultData = result.data;
            
            // Simple 3x3 sharpening kernel
            const kernel = [0, -1, 0, -1, 5, -1, 0, -1, 0];
            
            for (let y = 1; y < height - 1; y++) {
                for (let x = 1; x < width - 1; x++) {
                    let r = 0, g = 0, b = 0;
                    
                    for (let ky = -1; ky <= 1; ky++) {
                        for (let kx = -1; kx <= 1; kx++) {
                            const idx = ((y + ky) * width + (x + kx)) * 4;
                            const kernelIdx = (ky + 1) * 3 + (kx + 1);
                            const kernelValue = kernel[kernelIdx];
                            
                            r += data[idx] * kernelValue;
                            g += data[idx + 1] * kernelValue;
                            b += data[idx + 2] * kernelValue;
                        }
                    }
                    
                    const resultIdx = (y * width + x) * 4;
                    resultData[resultIdx] = Math.max(0, Math.min(255, r));
                    resultData[resultIdx + 1] = Math.max(0, Math.min(255, g));
                    resultData[resultIdx + 2] = Math.max(0, Math.min(255, b));
                    resultData[resultIdx + 3] = 255; // Alpha
                }
            }
            
            return result;
        },
        
        // Legacy parseMeasurements for backward compatibility
        parseMeasurements(text) {
            // Use utility-specific parsing by default
            return this.parseUtilityMeasurements(text);
        },
        
        // ==========================================
        // UI COMPONENTS (Updated for utility context)
        // ==========================================
        
        // Create image uploader with utility-specific enhancements
        createImageUploader(onMeasurementSelected, options = {}) {
            const {
                placeholder = 'Drag utility pole photo here or click to upload',
                maxSize = 10 * 1024 * 1024,
                allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
            } = options;
            
            const container = document.createElement('div');
            container.className = 'ocr-uploader';
            container.innerHTML = `
                <div class="upload-area" id="uploadArea">
                    <div class="upload-content">
                        <div class="upload-icon">📷</div>
                        <div class="upload-text">
                            <div><strong>Extract Measurements from Utility Photo</strong></div>
                            <div>Upload field photos with measurement annotations</div>
                            <div class="upload-actions">
                                <button class="upload-btn" type="button">Click to Upload Photo</button>
                                <span class="upload-or">or drag & drop</span>
                            </div>
                            <div class="upload-hint">
                                📏 Works best with clear measurement annotations<br>
                                Supports PNG, JPG, WebP • Max ${Math.round(maxSize / (1024 * 1024))}MB • Paste with Ctrl+V
                            </div>
                        </div>
                    </div>
                    <input type="file" id="imageInput" accept="${allowedTypes.join(',')}" style="display: none;" />
                </div>
                
                <div class="ocr-progress" id="ocrProgress" style="display: none;">
                    <div class="progress-header">
                        <div class="progress-title">🔍 Analyzing Utility Photo</div>
                        <button class="progress-cancel" id="cancelOcr" type="button">Cancel</button>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" id="progressFill"></div>
                    </div>
                    <div class="progress-text" id="progressText">Preparing utility image analysis...</div>
                </div>
                
                <div class="ocr-results" id="ocrResults" style="display: none;">
                    <div class="results-header">
                        <h4>🏗️ Utility Measurements Detected</h4>
                        <div class="results-actions">
                            <button class="btn-small secondary" id="viewRawText" type="button">View Raw Text</button>
                            <button class="btn-small secondary" id="retryUpload" type="button">Try Another Photo</button>
                        </div>
                    </div>
                    <div class="detected-measurements" id="detectedMeasurements"></div>
                    <div class="ocr-bottom-actions">
                        <button class="btn secondary" id="manualEntry">Manual Entry Instead</button>
                        <button class="btn" id="useSelected" disabled>Use Selected Measurement</button>
                    </div>
                </div>
                
                <div class="ocr-error" id="ocrError" style="display: none;">
                    <div class="error-content">
                        <div class="error-icon">⚠️</div>
                        <div class="error-text">
                            <div class="error-title">Photo Analysis Failed</div>
                            <div class="error-message" id="errorMessage"></div>
                            <div style="font-size: 0.8rem; color: #666; margin-top: 0.5rem;">
                                💡 Try photos with clear measurement annotations
                            </div>
                        </div>
                        <button class="btn secondary" id="retryOcr">Try Again</button>
                    </div>
                </div>
            `;
            
            // Get DOM elements
            const uploadArea = container.querySelector('#uploadArea');
            const imageInput = container.querySelector('#imageInput');
            const uploadBtn = container.querySelector('.upload-btn');
            const progress = container.querySelector('#ocrProgress');
            const progressFill = container.querySelector('#progressFill');
            const progressText = container.querySelector('#progressText');
            const cancelBtn = container.querySelector('#cancelOcr');
            const results = container.querySelector('#ocrResults');
            const detectedMeasurements = container.querySelector('#detectedMeasurements');
            const viewRawBtn = container.querySelector('#viewRawText');
            const retryUploadBtn = container.querySelector('#retryUpload');
            const manualEntryBtn = container.querySelector('#manualEntry');
            const useSelectedBtn = container.querySelector('#useSelected');
            const errorDiv = container.querySelector('#ocrError');
            const errorMessage = container.querySelector('#errorMessage');
            const retryOcrBtn = container.querySelector('#retryOcr');
            
            // State management
            let currentOcrProcess = null;
            let selectedMeasurements = [];
            let rawOcrText = '';
            let isProcessing = false;
            
            // Setup all event handlers (same as before but with utility-specific messaging)
            setupEventHandlers();
            
            function setupEventHandlers() {
                // File upload handlers
                uploadBtn.addEventListener('click', () => {
                    if (!isProcessing) imageInput.click();
                });
                
                imageInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) processImage(file);
                });
                
                // Enhanced drag and drop for utility photos
                uploadArea.addEventListener('dragover', (e) => {
                    e.preventDefault();
                    if (!isProcessing) {
                        uploadArea.classList.add('dragover');
                        uploadArea.querySelector('.upload-text div:first-child').innerHTML = 
                            '<strong>📋 Drop Utility Photo to Analyze</strong>';
                    }
                });
                
                uploadArea.addEventListener('dragleave', () => {
                    uploadArea.classList.remove('dragover');
                    uploadArea.querySelector('.upload-text div:first-child').innerHTML = 
                        '<strong>Extract Measurements from Utility Photo</strong>';
                });
                
                uploadArea.addEventListener('drop', (e) => {
                    e.preventDefault();
                    uploadArea.classList.remove('dragover');
                    uploadArea.querySelector('.upload-text div:first-child').innerHTML = 
                        '<strong>Extract Measurements from Utility Photo</strong>';
                    
                    if (isProcessing) return;
                    
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('image/')) {
                        processImage(file);
                    } else {
                        window.OCRSystem.showError('Please drop a valid utility photo');
                    }
                });
                
                // Global paste support
                const handlePaste = (e) => {
                    if (!container.isConnected || isProcessing) return;
                    
                    const items = e.clipboardData?.items;
                    if (!items) return;
                    
                    for (const item of items) {
                        if (item.type.startsWith('image/')) {
                            e.preventDefault();
                            const file = item.getAsFile();
                            if (file) {
                                console.log('Utility photo pasted from clipboard');
                                processImage(file);
                                break;
                            }
                        }
                    }
                };
                
                // Add paste listener when component is visible
                const observer = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            document.addEventListener('paste', handlePaste);
                        } else {
                            document.removeEventListener('paste', handlePaste);
                        }
                    });
                });
                observer.observe(container);
                
                // Result action handlers
                setupResultHandlers();
                
                // Cleanup
                container.cleanup = () => {
                    observer.disconnect();
                    document.removeEventListener('paste', handlePaste);
                };
            }
            
            function setupResultHandlers() {
                cancelBtn.addEventListener('click', () => {
                    if (currentOcrProcess) currentOcrProcess.cancel = true;
                    resetUploader();
                });
                
                viewRawBtn.addEventListener('click', () => {
                    const popup = document.createElement('div');
                    popup.style.cssText = `
                        position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                        background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                        max-width: 80vw; max-height: 80vh; overflow: auto; z-index: 10000;
                    `;
                    popup.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                            <h3 style="margin: 0;">Raw OCR Text from Utility Photo</h3>
                            <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">×</button>
                        </div>
                        <pre style="white-space: pre-wrap; font-family: monospace; background: #f5f5f5; padding: 1rem; border-radius: 4px; max-height: 400px; overflow: auto;">${rawOcrText || 'No text extracted from utility photo'}</pre>
                        <div style="margin-top: 1rem; font-size: 0.9rem; color: #666;">
                            💡 Look for measurement patterns like "30'-9"", "26'-3"", or similar utility annotations
                        </div>
                    `;
                    document.body.appendChild(popup);
                });
                
                retryUploadBtn.addEventListener('click', resetUploader);
                retryOcrBtn.addEventListener('click', resetUploader);
                
                manualEntryBtn.addEventListener('click', () => {
                    resetUploader();
                    const manualInput = document.querySelector('.smart-input:not([readonly])');
                    if (manualInput) manualInput.focus();
                });
                
                useSelectedBtn.addEventListener('click', () => {
                    const selected = container.querySelector('input[name="ocrMeasurement"]:checked');
                    if (selected && onMeasurementSelected) {
                        onMeasurementSelected(selected.value, selectedMeasurements, { rawText: rawOcrText });
                        resetUploader();
                        
                        if (window.TechTools && window.TechTools.UI) {
                            window.TechTools.UI.showAlert('📐 Utility measurement extracted and applied!', 'success');
                        }
                    }
                });
            }
            
            async function processImage(file) {
                if (!file || isProcessing) return;
                
                try {
                    isProcessing = true;
                    
                    // Validate file
                    if (!allowedTypes.includes(file.type)) {
                        throw new Error(`Unsupported file type: ${file.type}`);
                    }
                    
                    if (file.size > maxSize) {
                        throw new Error(`File too large: ${Math.round(file.size / (1024 * 1024))}MB (max ${Math.round(maxSize / (1024 * 1024))}MB)`);
                    }
                    
                    console.log('Processing utility photo:', file.name, file.type, file.size);
                    
                    showProgress();
                    
                    const updateProgress = (text, percent) => {
                        if (currentOcrProcess?.cancel) return;
                        progressText.textContent = text;
                        progressFill.style.width = percent + '%';
                    };
                    
                    currentOcrProcess = { cancel: false };
                    
                    // Use enhanced utility-specific extraction
                    const result = await window.OCRSystem.extractMeasurements(file, updateProgress);
                    
                    if (currentOcrProcess?.cancel) {
                        resetUploader();
                        return;
                    }
                    
                    if (result.success) {
                        rawOcrText = result.rawText;
                        selectedMeasurements = result.measurements;
                        displayUtilityResults(result.measurements, result.confidence, result.rawText);
                    } else {
                        showError(result.error);
                    }
                    
                } catch (error) {
                    console.error('Utility photo processing error:', error);
                    showError(error.message);
                } finally {
                    isProcessing = false;
                    currentOcrProcess = null;
                }
            }
            
            function showProgress() {
                uploadArea.style.display = 'none';
                progress.style.display = 'block';
                results.style.display = 'none';
                errorDiv.style.display = 'none';
            }
            
            function displayUtilityResults(measurements, confidence, rawText) {
                detectedMeasurements.innerHTML = '';
                
                if (measurements.length === 0) {
                    detectedMeasurements.innerHTML = `
                        <div class="no-measurements">
                            <div style="text-align: center; color: #666; padding: 2rem;">
                                <div style="font-size: 2rem; margin-bottom: 1rem;">🔍</div>
                                <div style="font-size: 1.1rem; margin-bottom: 0.5rem;">No clear measurements found</div>
                                <div style="font-size: 0.9rem; color: #999;">
                                    OCR confidence: ${confidence}%<br>
                                    💡 Try photos with visible measurement annotations like "30'-9"" or "26'-3""
                                </div>
                                <button class="btn secondary" style="margin-top: 1rem;" onclick="this.closest('.ocr-uploader').querySelector('#manualEntry').click()">
                                    Manual Entry Instead
                                </button>
                            </div>
                        </div>
                    `;
                    resetUploader();
                    return;
                }
                
                // Group measurements by context if possible
                const powerMeasurements = measurements.filter(m => m.context && m.context.isPower);
                const commMeasurements = measurements.filter(m => m.context && m.context.isComm);
                const unknownMeasurements = measurements.filter(m => !m.context || (!m.context.isPower && !m.context.isComm));
                
                if (powerMeasurements.length > 0 || commMeasurements.length > 0) {
                    // Show categorized results
                    let html = '<div class="utility-categorized-results">';
                    
                    if (powerMeasurements.length > 0) {
                        html += `
                            <div class="utility-category">
                                <h5 style="color: var(--color-primary); margin: 0 0 0.5rem 0;">⚡ Power Attachments (Higher)</h5>
                        `;
                        powerMeasurements.slice(0, 3).forEach((measurement, idx) => {
                            html += createMeasurementOption(measurement, idx, 'power');
                        });
                        html += '</div>';
                    }
                    
                    if (commMeasurements.length > 0) {
                        html += `
                            <div class="utility-category">
                                <h5 style="color: #7b1fa2; margin: 1rem 0 0.5rem 0;">📡 Communication Attachments (Lower)</h5>
                        `;
                        commMeasurements.slice(0, 3).forEach((measurement, idx) => {
                            html += createMeasurementOption(measurement, idx + powerMeasurements.length, 'comm');
                        });
                        html += '</div>';
                    }
                    
                    if (unknownMeasurements.length > 0) {
                        html += `
                            <div class="utility-category">
                                <h5 style="color: #666; margin: 1rem 0 0.5rem 0;">📏 Other Measurements</h5>
                        `;
                        unknownMeasurements.slice(0, 2).forEach((measurement, idx) => {
                            html += createMeasurementOption(measurement, idx + powerMeasurements.length + commMeasurements.length, 'unknown');
                        });
                        html += '</div>';
                    }
                    
                    html += '</div>';
                    detectedMeasurements.innerHTML = html;
                } else {
                    // Standard results display
                    measurements.slice(0, 5).forEach((measurement, idx) => {
                        const item = document.createElement('div');
                        item.className = 'measurement-item';
                        item.innerHTML = createMeasurementOption(measurement, idx, 'standard');
                        detectedMeasurements.appendChild(item);
                    });
                }
                
                useSelectedBtn.disabled = false;
                progress.style.display = 'none';
                results.style.display = 'block';
            }
            
            function createMeasurementOption(measurement, idx, category) {
                const contextInfo = measurement.context ? 
                    `${measurement.context.type}: ${measurement.context.text.substring(0, 25)}...` : 
                    `from "${measurement.original}"`;
                
                return `
                    <div class="measurement-item ${category}">
                        <input type="radio" name="ocrMeasurement" id="measurement-${idx}" 
                               value="${measurement.formatted}" ${idx === 0 ? 'checked' : ''} />
                        <label for="measurement-${idx}">
                            <div class="measurement-primary">
                                <span class="measurement-value">${measurement.formatted}</span>
                                <span class="measurement-inches">(${measurement.totalInches}")</span>
                                ${measurement.patternType ? `<span class="measurement-type">${measurement.patternType}</span>` : ''}
                            </div>
                            <div class="measurement-meta">
                                <span class="measurement-context">${contextInfo}</span>
                                <span class="measurement-confidence">${measurement.confidence}%</span>
                            </div>
                        </label>
                    </div>
                `;
            }
            
            function showError(message) {
                errorMessage.textContent = message;
                uploadArea.style.display = 'none';
                progress.style.display = 'none';
                results.style.display = 'none';
                errorDiv.style.display = 'block';
            }
            
            function resetUploader() {
                setTimeout(() => {
                    uploadArea.style.display = 'block';
                    progress.style.display = 'none';
                    results.style.display = 'none';
                    errorDiv.style.display = 'none';
                    imageInput.value = '';
                    selectedMeasurements = [];
                    rawOcrText = '';
                    isProcessing = false;
                    currentOcrProcess = null;
                    useSelectedBtn.disabled = true;
                }, 1000);
            }
            
            return container;
        },
        
        // Utility function to show errors
        showError(message) {
            console.error('OCR System Error:', message);
            if (window.TechTools && window.TechTools.UI) {
                window.TechTools.UI.showAlert(message, 'error');
            } else {
                alert('OCR Error: ' + message);
            }
        }
    };
    
    // ==========================================
    // AUTO-INITIALIZE
    // ==========================================
    
    // Check if Tesseract is available
    if (typeof Tesseract === 'undefined') {
        console.warn('Tesseract.js not loaded - OCR functionality will be unavailable');
        window.OCRSystem.available = false;
    } else {
        console.log('Enhanced Utility OCR System ready - Tesseract.js loaded');
        window.OCRSystem.available = true;
    }
    
})();