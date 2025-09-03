// TechTools Utility-Specific OCR Enhancement
// Advanced OCR parsing specifically for utility pole field photos and measurements

window.TechTools = window.TechTools || {};

window.TechTools.UtilityOCR = {
    
    // Enhanced measurement extraction for utility field photos
    extractUtilityMeasurements(ocrText) {
        if (!ocrText || typeof ocrText !== 'string') {
            return { powerMeasurements: [], commMeasurements: [], allMeasurements: [] };
        }
        
        console.log('Processing utility OCR text:', ocrText);
        
        const allMeasurements = [];
        const powerMeasurements = [];
        const commMeasurements = [];
        
        // Enhanced patterns for utility field measurements
        const utilityPatterns = [
            // Complete measurements with feet and inches
            /(\d{1,2})['′]\s*[-–]?\s*(\d{1,2})["″]/gi,                    // 30'9", 26'3"
            /(\d{1,2})\s*[-–]\s*(\d{1,2})\s*['″"]/gi,                    // 30-9", 26-3"
            /(\d{1,2})['′]?\s*(\d{1,2})["″]?\s*/gi,                     // 30'9, 269
            
            // Measurements with explicit units
            /(\d{1,2})\s*ft\s*(\d{1,2})\s*in/gi,                        // 30 ft 9 in
            /(\d{1,2})\s*feet\s*(\d{1,2})\s*inch/gi,                   // 30 feet 9 inch
            
            // Technical annotation format
            /(\d{1,2})\s*[-–]\s*(\d{1,2})/gi,                           // 30-9, 26-3
            
            // Single unit measurements
            /(\d{1,2})['′]?\s*(\d{1,2})["″]?/gi,                        // 309, 263 (interpreted as 30'9", 26'3")
            
            // Height measurements in context
            /height\s*[:=]?\s*(\d{1,2})['′]?\s*[-–]?\s*(\d{1,2})["″]?/gi, // height: 30'9"
            /(\d{1,2})['′]\s*[-–]?\s*(\d{1,2})["″]?\s*(?:high|height)/gi  // 30'9" high
        ];
        
        utilityPatterns.forEach((pattern, patternIdx) => {
            let match;
            const regex = new RegExp(pattern.source, pattern.flags);
            
            while ((match = regex.exec(ocrText)) !== null) {
                try {
                    let feet = parseInt(match[1]) || 0;
                    let inches = parseInt(match[2]) || 0;
                    
                    // Handle special cases for utility measurements
                    if (patternIdx === 6) { // Single concatenated numbers like "309"
                        const fullNumber = match[1] + match[2];
                        if (fullNumber.length === 3) {
                            feet = parseInt(fullNumber.substring(0, 2));
                            inches = parseInt(fullNumber.substring(2));
                        }
                    }
                    
                    // Validate reasonable utility pole heights (8-60 feet)
                    if (feet >= 8 && feet <= 60 && inches >= 0 && inches < 12) {
                        const totalInches = feet * 12 + inches;
                        const formatted = `${feet}-${inches}`;
                        
                        const measurement = {
                            original: match[0].trim(),
                            feet,
                            inches,
                            formatted: `${feet}'-${inches}"`,
                            totalInches,
                            confidence: this.calculateUtilityConfidence(match[0], ocrText, totalInches),
                            context: this.determineContext(match[0], ocrText),
                            isReasonableHeight: this.isReasonableUtilityHeight(totalInches)
                        };
                        
                        allMeasurements.push(measurement);
                        
                        // Categorize by context
                        if (measurement.context.isPower) {
                            powerMeasurements.push(measurement);
                        } else if (measurement.context.isComm) {
                            commMeasurements.push(measurement);
                        }
                    }
                } catch (error) {
                    console.warn('Failed to parse utility measurement:', match[0], error);
                }
            }
        });
        
        // Remove duplicates and sort
        const uniqueAll = this.removeDuplicateMeasurements(allMeasurements);
        const uniquePower = this.removeDuplicateMeasurements(powerMeasurements);
        const uniqueComm = this.removeDuplicateMeasurements(commMeasurements);
        
        console.log('Extracted measurements:', {
            all: uniqueAll.length,
            power: uniquePower.length,
            comm: uniqueComm.length
        });
        
        return {
            allMeasurements: uniqueAll,
            powerMeasurements: uniquePower.sort((a, b) => b.totalInches - a.totalInches), // Highest first
            commMeasurements: uniqueComm.sort((a, b) => b.confidence - a.confidence)
        };
    },
    
    // Determine if measurement is power, communication, or unknown based on context
    determineContext(measurementText, fullText) {
        const surroundingText = this.getTextAround(measurementText, fullText, 50);
        
        // Power indicators (usually higher on pole)
        const powerKeywords = [
            'power', 'electric', 'energy', 'kv', 'voltage', 'supply', 'primary',
            'neutral', 'pwr', 'elec', 'high', 'upper', 'top', 'overhead',
            'transmission', 'distribution', 'utility', 'grid'
        ];
        
        // Communication indicators (usually lower on pole)
        const commKeywords = [
            'comm', 'communication', 'fiber', 'cable', 'internet', 'phone', 'data',
            'spectrum', 'comcast', 'verizon', 'att', 'telecom', 'broadband',
            'coax', 'cat5', 'cat6', 'ethernet', 'network', 'low', 'lower', 'bottom'
        ];
        
        const textLower = surroundingText.toLowerCase();
        
        const powerScore = powerKeywords.reduce((score, keyword) => {
            return score + (textLower.includes(keyword) ? 1 : 0);
        }, 0);
        
        const commScore = commKeywords.reduce((score, keyword) => {
            return score + (textLower.includes(keyword) ? 1 : 0);
        }, 0);
        
        return {
            isPower: powerScore > commScore && powerScore > 0,
            isComm: commScore > powerScore && commScore > 0,
            isUnknown: powerScore === commScore,
            powerScore,
            commScore,
            context: surroundingText
        };
    },
    
    // Get text around a measurement for context analysis
    getTextAround(target, fullText, radius = 30) {
        const index = fullText.toLowerCase().indexOf(target.toLowerCase());
        if (index === -1) return target;
        
        const start = Math.max(0, index - radius);
        const end = Math.min(fullText.length, index + target.length + radius);
        
        return fullText.substring(start, end);
    },
    
    // Check if height is reasonable for utility pole attachment
    isReasonableUtilityHeight(totalInches) {
        const feet = totalInches / 12;
        
        // Typical utility pole heights and attachments
        return {
            isReasonable: feet >= 8 && feet <= 60,
            isPowerRange: feet >= 20 && feet <= 50,     // Power typically 20-50 feet
            isCommRange: feet >= 12 && feet <= 35,      // Communication typically 12-35 feet
            isTooLow: feet < 8,                         // Unlikely for pole attachments
            isTooHigh: feet > 60                        // Unlikely for standard poles
        };
    },
    
    // Enhanced confidence calculation for utility measurements
    calculateUtilityConfidence(originalText, fullText, totalInches) {
        let confidence = 50; // Base score
        
        const heightCheck = this.isReasonableUtilityHeight(totalInches);
        
        // Utility-specific bonuses
        if (heightCheck.isReasonable) confidence += 25;
        if (heightCheck.isPowerRange || heightCheck.isCommRange) confidence += 15;
        
        // Format quality bonuses
        if (originalText.includes('-')) confidence += 20;
        if (originalText.match(/\d+['′]\s*\d+["″]/)) confidence += 25; // Traditional format
        if (originalText.length >= 3 && originalText.length <= 8) confidence += 10;
        
        // Context bonuses
        const context = this.determineContext(originalText, fullText);
        if (context.powerScore > 0 || context.commScore > 0) confidence += 15;
        
        // Penalize unreasonable measurements
        if (heightCheck.isTooLow || heightCheck.isTooHigh) confidence -= 30;
        if (originalText.length > 12) confidence -= 15;
        
        return Math.max(0, Math.min(100, Math.round(confidence)));
    },
    
    // Remove duplicate measurements (within 2 inches tolerance)
    removeDuplicateMeasurements(measurements) {
        return measurements.filter((measurement, index, array) => {
            return !array.some((other, otherIndex) => {
                return otherIndex < index && 
                       Math.abs(measurement.totalInches - other.totalInches) <= 2;
            });
        });
    },
    
    // Create enhanced utility measurement selector
    createUtilityMeasurementSelector(extractedData, onSelectionCallback) {
        const { allMeasurements, powerMeasurements, commMeasurements } = extractedData;
        
        const container = document.createElement('div');
        container.className = 'utility-measurement-selector';
        
        // If we have both power and communication measurements, show smart selection
        if (powerMeasurements.length > 0 && commMeasurements.length > 0) {
            container.innerHTML = `
                <div class="smart-selection">
                    <h4>🏗️ Smart Utility Pole Analysis</h4>
                    <p style="font-size: 0.9rem; color: #666; margin-bottom: 1rem;">
                        Based on context analysis, we've identified potential power and communication attachments:
                    </p>
                    
                    <div class="attachment-categories">
                        <div class="power-section">
                            <h5>⚡ Potential Power Attachments (Higher)</h5>
                            <div class="measurement-options" id="powerOptions"></div>
                        </div>
                        
                        <div class="comm-section">
                            <h5>📡 Potential Communication Attachments (Lower)</h5>
                            <div class="measurement-options" id="commOptions"></div>
                        </div>
                    </div>
                    
                    <div class="selection-actions">
                        <button class="btn secondary" id="usePoleSeparation">Use for Pole Separation Check</button>
                        <button class="btn secondary" id="useManualSelection">Manual Selection</button>
                    </div>
                </div>
            `;
            
            // Populate power options
            const powerOptions = container.querySelector('#powerOptions');
            powerMeasurements.slice(0, 3).forEach((measurement, idx) => {
                const option = document.createElement('div');
                option.className = 'utility-measurement-option';
                option.innerHTML = `
                    <input type="radio" name="powerHeight" value="${measurement.formatted}" id="power-${idx}" ${idx === 0 ? 'checked' : ''} />
                    <label for="power-${idx}">
                        <span class="measurement-value">${measurement.formatted}</span>
                        <span class="measurement-context">${measurement.context.context.substring(0, 30)}...</span>
                        <span class="measurement-confidence">${measurement.confidence}%</span>
                    </label>
                `;
                powerOptions.appendChild(option);
            });
            
            // Populate communication options
            const commOptions = container.querySelector('#commOptions');
            commMeasurements.slice(0, 3).forEach((measurement, idx) => {
                const option = document.createElement('div');
                option.className = 'utility-measurement-option';
                option.innerHTML = `
                    <input type="radio" name="commHeight" value="${measurement.formatted}" id="comm-${idx}" ${idx === 0 ? 'checked' : ''} />
                    <label for="comm-${idx}">
                        <span class="measurement-value">${measurement.formatted}</span>
                        <span class="measurement-context">${measurement.context.context.substring(0, 30)}...</span>
                        <span class="measurement-confidence">${measurement.confidence}%</span>
                    </label>
                `;
                commOptions.appendChild(option);
            });
            
            // Handle pole separation selection
            container.querySelector('#usePoleSeparation').addEventListener('click', () => {
                const selectedPower = container.querySelector('input[name="powerHeight"]:checked')?.value;
                const selectedComm = container.querySelector('input[name="commHeight"]:checked')?.value;
                
                if (selectedPower && selectedComm && onSelectionCallback) {
                    onSelectionCallback({
                        type: 'pole-separation',
                        powerHeight: selectedPower,
                        commHeight: selectedComm
                    });
                }
            });
            
        } else {
            // Fallback to standard measurement selection
            container.innerHTML = `
                <div class="standard-selection">
                    <h4>📐 Detected Measurements</h4>
                    <p style="font-size: 0.9rem; color: #666; margin-bottom: 1rem;">
                        Select the measurement you want to use:
                    </p>
                    <div class="measurement-options" id="allOptions"></div>
                    <div class="selection-actions">
                        <button class="btn" id="useStandardMeasurement" disabled>Use Selected Measurement</button>
                    </div>
                </div>
            `;
            
            const allOptions = container.querySelector('#allOptions');
            allMeasurements.slice(0, 5).forEach((measurement, idx) => {
                const option = document.createElement('div');
                option.className = 'utility-measurement-option';
                option.innerHTML = `
                    <input type="radio" name="standardMeasurement" value="${measurement.formatted}" id="std-${idx}" ${idx === 0 ? 'checked' : ''} />
                    <label for="std-${idx}">
                        <span class="measurement-value">${measurement.formatted}</span>
                        <span class="measurement-original">from "${measurement.original}"</span>
                        <span class="measurement-confidence">${measurement.confidence}%</span>
                    </label>
                `;
                allOptions.appendChild(option);
            });
            
            const useBtn = container.querySelector('#useStandardMeasurement');
            useBtn.disabled = allMeasurements.length === 0;
            
            useBtn.addEventListener('click', () => {
                const selected = container.querySelector('input[name="standardMeasurement"]:checked')?.value;
                if (selected && onSelectionCallback) {
                    onSelectionCallback({
                        type: 'single-measurement',
                        measurement: selected
                    });
                }
            });
        }
        
        // Add manual override option
        const manualDiv = document.createElement('div');
        manualDiv.className = 'manual-override';
        manualDiv.innerHTML = `
            <div style="border-top: 1px solid var(--color-border); padding-top: 1rem; margin-top: 1rem;">
                <button class="btn secondary" id="manualOverride">Manual Entry Instead</button>
            </div>
        `;
        container.appendChild(manualDiv);
        
        container.querySelector('#manualOverride').addEventListener('click', () => {
            if (onSelectionCallback) {
                onSelectionCallback({ type: 'manual' });
            }
        });
        
        return container;
    }
};

// Enhanced OCR patterns specifically for utility field photos
window.OCRSystem.extractUtilityMeasurements = window.TechTools.UtilityOCR.extractUtilityMeasurements.bind(window.TechTools.UtilityOCR);

// Override the parseMeasurements function with utility-specific logic
const originalParseMeasurements = window.OCRSystem.parseMeasurements;
window.OCRSystem.parseMeasurements = function(text) {
    // First try utility-specific extraction
    const utilityResults = window.TechTools.UtilityOCR.extractUtilityMeasurements(text);
    
    if (utilityResults.allMeasurements.length > 0) {
        console.log('Using utility-specific OCR parsing');
        return utilityResults.allMeasurements.sort((a, b) => b.confidence - a.confidence);
    } else {
        console.log('Falling back to standard OCR parsing');
        return originalParseMeasurements.call(this, text);
    }
};

// Create enhanced uploader for clearance tools that can handle pole separation
window.OCRSystem.createUtilityImageUploader = function(onMeasurementSelected, toolType = 'clearance') {
    const baseUploader = this.createImageUploader((extractedValue, allMeasurements, fullOcrData) => {
        // Enhanced callback that provides more context
        if (toolType === 'pole-clearance') {
            // For pole clearance, try to extract both power and communication heights
            const utilityData = window.TechTools.UtilityOCR.extractUtilityMeasurements(fullOcrData?.rawText || '');
            
            if (utilityData.powerMeasurements.length > 0 && utilityData.commMeasurements.length > 0) {
                // Show smart selection interface
                const selector = window.TechTools.UtilityOCR.createUtilityMeasurementSelector(
                    utilityData, 
                    (selection) => {
                        if (selection.type === 'pole-separation') {
                            onMeasurementSelected(selection);
                        } else if (selection.type === 'single-measurement') {
                            onMeasurementSelected(selection.measurement);
                        } else {
                            onMeasurementSelected(null); // Manual entry
                        }
                    }
                );
                
                // Replace the standard results with smart selector
                const resultsDiv = baseUploader.querySelector('#ocrResults');
                const measurementsDiv = baseUploader.querySelector('#detectedMeasurements');
                measurementsDiv.innerHTML = '';
                measurementsDiv.appendChild(selector);
                return;
            }
        }
        
        // Standard single measurement callback
        onMeasurementSelected(extractedValue);
    });
    
    return baseUploader;
};

console.log('🏗️ TechTools Utility OCR enhancements loaded');
