// Complete ILL Workflow with Proof System
// File: assets/js/modules/ill-workflow.js

(function() {
    'use strict';

    const ILLWorkflow = {
        // Email templates for each step
        templates: {
            orderPlaced: `Subject: ILL Order Placed - {title}

Dear Patron,

Your interlibrary loan request has been placed with DOCLINE.

Article: {title}
Authors: {authors}
Journal: {journal}
DOCLINE Number: {doclineNumber}
Date Ordered: {dateOrdered}
Request ID: {requestId}

Expected delivery: 7-10 business days
You will receive updates as the request progresses.

{librarianName}
{libraryName}
{contactInfo}`,

            followUpProof: `Subject: ILL Follow-up Completed - {title}

INTERNAL FOLLOW-UP RECORD

Request ID: {requestId}
DOCLINE Number: {doclineNumber}
Follow-up Date: {followupDate}
Action Taken: {actionTaken}

Status Update: {statusUpdate}
Next Action: {nextAction}
Expected Timeline: {expectedTimeline}

Completed by: {librarianName}
{timestamp}`,

            statusCheck: `Subject: ILL Status Check - {title}

INTERNAL STATUS VERIFICATION

Request ID: {requestId}
DOCLINE Number: {doclineNumber}
Check Date: {checkDate}
Current Status: {currentStatus}

Verification Method: {verificationMethod}
Status Details: {statusDetails}
Action Required: {actionRequired}

Verified by: {librarianName}
{timestamp}`,

            updateReceived: `Subject: ILL Update Received - {title}

Dear Patron,

Update received on your interlibrary loan request:

Request ID: {requestId}
DOCLINE Number: {doclineNumber}
Update Date: {updateDate}
New Status: {newStatus}

Update Details: {updateDetails}
Next Steps: {nextSteps}
Expected Timeline: {expectedTimeline}

{librarianName}
{libraryName}
{contactInfo}`
        },

        // Initialize the workflow system
        initialize() {
            console.log('📋 Loading ILL Workflow System...');
            this.addWorkflowUI();
            this.startReminderSystem();
            this.setupEventListeners();
        },

        // Add workflow buttons and UI
        addWorkflowUI() {
            const style = document.createElement('style');
            style.textContent = `
                .workflow-btn {
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    font-size: 11px;
                    cursor: pointer;
                    margin: 2px;
                }
                .workflow-btn.step1 { background: #28a745; }
                .workflow-btn.step2 { background: #ffc107; color: #000; }
                .workflow-btn.step3 { background: #dc3545; }
                .workflow-btn.step4 { background: #6f42c1; }
                .workflow-btn:hover { opacity: 0.8; }
                
                .workflow-stamp {
                    background: #e8f4fd;
                    border: 1px solid #007bff;
                    padding: 6px 10px;
                    margin: 4px 0;
                    border-radius: 4px;
                    font-size: 10px;
                }
                
                .reminder-badge {
                    background: #dc3545;
                    color: white;
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-size: 10px;
                    font-weight: bold;
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                
                .docline-input {
                    width: 150px;
                    padding: 4px 8px;
                    border: 1px solid #ccc;
                    border-radius: 3px;
                    font-size: 11px;
                    margin: 2px;
                }
            `;
            document.head.appendChild(style);

            this.observeRequestCards();
        },

        // Watch for request cards and add workflow buttons
        observeRequestCards() {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1 && node.classList && node.classList.contains('request-card')) {
                            this.addWorkflowToCard(node);
                        }
                    });
                });
            });

            const requestList = document.getElementById('request-list');
            if (requestList) {
                observer.observe(requestList, { childList: true, subtree: true });
            }

            // Add to existing cards
            setTimeout(() => {
                document.querySelectorAll('.request-card').forEach(card => {
                    this.addWorkflowToCard(card);
                });
            }, 1000);
        },

        // Add workflow buttons to request card
        addWorkflowToCard(card) {
            if (card.querySelector('.workflow-buttons')) return;

            const requestData = this.extractRequestData(card);
            const workflow = requestData.workflow || {};

            const container = document.createElement('div');
            container.className = 'workflow-buttons';
            container.style.marginTop = '10px';
            container.style.borderTop = '1px solid #eee';
            container.style.paddingTop = '8px';

            // Step 1: Place Order
            let step1HTML = '';
            if (!workflow.orderPlaced) {
                step1HTML = `
                    <div style="margin-top: 15px; text-align: right;">
                        <button onclick="navigator.clipboard.writeText(this.parentElement.previousElementSibling.value).then(() => alert('Email copied to clipboard!')).catch(() => alert('Please manually copy the email text'))" 
                                style="background: #007bff; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-right: 10px;">
                            📋 Copy Email
                        </button>
                        <button onclick="this.closest('div').parentElement.remove()" 
                                style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px;">
                            Close
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(popup);
        },

        fillTemplate(template, data) {
            return template.replace(/\{(\w+)\}/g, (match, key) => data[key] || match);
        },

        getSettings() {
            if (!this.settings) {
                const defaultSettings = {
                    librarianName: 'Library Staff',
                    libraryName: 'Library',
                    contactInfo: 'library@institution.edu'
                };
                
                this.settings = {
                    ...defaultSettings,
                    ...(window.SilentStacks?.modules?.DataManager?.getSettings()?.paperTrail || {})
                };
            }
            return this.settings;
        }
    };

    // Make globally available
    window.ILLWorkflow = ILLWorkflow;

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ILLWorkflow.initialize());
    } else {
        ILLWorkflow.initialize();
    }

    console.log('📋 Complete ILL Workflow System loaded');

})(); style="margin: 4px 0;">
                        <input type="text" class="docline-input" placeholder="DOCLINE Number" id="docline-${requestData.id}">
                        <button class="workflow-btn step1" onclick="ILLWorkflow.step1_placeOrder(this, '${requestData.id}')">
                            📤 1. Place Order
                        </button>
                    </div>
                `;
            }

            // Step 2: Follow-up (after 5 days)
            let step2HTML = '';
            if (workflow.orderPlaced && this.needsFollowup(workflow) && !workflow.followupCompleted) {
                step2HTML = `
                    <div style="margin: 4px 0;">
                        <span class="reminder-badge">5+ DAYS - FOLLOW-UP NEEDED</span>
                        <button class="workflow-btn step2" onclick="ILLWorkflow.step2_followUp(this, '${requestData.id}')">
                            📞 2. Follow Up
                        </button>
                    </div>
                `;
            }

            // Step 3: Status Check
            let step3HTML = '';
            if (workflow.followupCompleted && !workflow.statusChecked) {
                step3HTML = `
                    <div style="margin: 4px 0;">
                        <button class="workflow-btn step3" onclick="ILLWorkflow.step3_statusCheck(this, '${requestData.id}')">
                            🔍 3. Check Status
                        </button>
                    </div>
                `;
            }

            // Step 4: Update Received
            let step4HTML = '';
            if (workflow.statusChecked && !workflow.updateReceived) {
                step4HTML = `
                    <div style="margin: 4px 0;">
                        <button class="workflow-btn step4" onclick="ILLWorkflow.step4_updateReceived(this, '${requestData.id}')">
                            📬 4. Update Received
                        </button>
                    </div>
                `;
            }

            container.innerHTML = step1HTML + step2HTML + step3HTML + step4HTML;

            // Add workflow stamps for completed steps
            this.addWorkflowStamps(container, workflow);

            card.appendChild(container);
        },

        // Step 1: Place Order with DOCLINE
        step1_placeOrder(button, requestId) {
            const doclineInput = document.getElementById(`docline-${requestId}`);
            const doclineNumber = doclineInput ? doclineInput.value.trim() : '';

            if (!doclineNumber) {
                alert('Please enter the DOCLINE number first!');
                doclineInput?.focus();
                return;
            }

            const card = button.closest('.request-card');
            const request = this.extractRequestData(card);
            const settings = this.getSettings();

            // Generate order confirmation email
            const email = this.fillTemplate(this.templates.orderPlaced, {
                title: request.title,
                authors: request.authors,
                journal: request.journal,
                doclineNumber: doclineNumber,
                dateOrdered: new Date().toLocaleString(),
                requestId: request.id,
                librarianName: settings.librarianName || 'Library Staff',
                libraryName: settings.libraryName || 'Library',
                contactInfo: settings.contactInfo || 'library@institution.edu'
            });

            // Save workflow step
            const workflow = {
                orderPlaced: true,
                orderDate: new Date().toISOString(),
                doclineNumber: doclineNumber,
                librarianName: settings.librarianName || 'Library Staff'
            };

            this.saveWorkflowStep(card, workflow);
            this.showEmailPopup('Order Confirmation Email', email);
            this.refreshWorkflowButtons(card);

            console.log('✅ Step 1: Order placed with DOCLINE:', doclineNumber);
        },

        // Step 2: Follow-up after 5 days
        step2_followUp(button, requestId) {
            this.showFollowUpForm(button, requestId);
        },

        // Show follow-up form
        showFollowUpForm(button, requestId) {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.5); z-index: 10000;
                display: flex; align-items: center; justify-content: center;
            `;

            modal.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 8px; max-width: 500px; width: 90%;">
                    <h3>📞 Follow-up Required</h3>
                    <form id="followup-form">
                        <div style="margin: 10px 0;">
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Action Taken:</label>
                            <select id="action-taken" style="width: 100%; padding: 8px; border: 1px solid #ccc;">
                                <option value="">-- Select Action --</option>
                                <option value="checked_docline">Checked DOCLINE status</option>
                                <option value="called_library">Called lending library</option>
                                <option value="emailed_library">Emailed lending library</option>
                                <option value="checked_vendor">Checked with vendor</option>
                                <option value="escalated">Escalated to supervisor</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div style="margin: 10px 0;">
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Status Update:</label>
                            <textarea id="status-update" style="width: 100%; height: 60px; padding: 8px; border: 1px solid #ccc;" 
                                      placeholder="What did you find out?"></textarea>
                        </div>
                        <div style="margin: 10px 0;">
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Next Action:</label>
                            <input type="text" id="next-action" style="width: 100%; padding: 8px; border: 1px solid #ccc;" 
                                   placeholder="What needs to happen next?">
                        </div>
                        <div style="text-align: right; margin-top: 15px;">
                            <button type="button" onclick="this.closest('div').parentElement.remove()" 
                                    style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-right: 10px;">
                                Cancel
                            </button>
                            <button type="button" onclick="ILLWorkflow.saveFollowUp('${requestId}', this)" 
                                    style="background: #ffc107; color: #000; border: none; padding: 8px 16px; border-radius: 4px;">
                                📞 Complete Follow-up
                            </button>
                        </div>
                    </form>
                </div>
            `;

            document.body.appendChild(modal);
        },

        // Save follow-up
        saveFollowUp(requestId, button) {
            const actionTaken = document.getElementById('action-taken').value;
            const statusUpdate = document.getElementById('status-update').value;
            const nextAction = document.getElementById('next-action').value;

            if (!actionTaken || !statusUpdate) {
                alert('Please fill in all required fields!');
                return;
            }

            const card = document.querySelector(`[data-request-id="${requestId}"]`) || 
                        Array.from(document.querySelectorAll('.request-card')).find(c => 
                            this.extractRequestData(c).id === requestId);

            const settings = this.getSettings();
            const request = this.extractRequestData(card);

            // Generate follow-up proof email
            const email = this.fillTemplate(this.templates.followUpProof, {
                title: request.title,
                requestId: request.id,
                doclineNumber: request.workflow?.doclineNumber || 'N/A',
                followupDate: new Date().toLocaleDateString(),
                actionTaken: actionTaken,
                statusUpdate: statusUpdate,
                nextAction: nextAction,
                expectedTimeline: 'TBD',
                librarianName: settings.librarianName || 'Library Staff',
                timestamp: new Date().toLocaleString()
            });

            // Save workflow step
            const workflow = {
                ...request.workflow,
                followupCompleted: true,
                followupDate: new Date().toISOString(),
                followupAction: actionTaken,
                followupNotes: statusUpdate,
                nextAction: nextAction
            };

            this.saveWorkflowStep(card, workflow);
            button.closest('div').parentElement.remove(); // Close modal
            this.showEmailPopup('Follow-up Proof Email', email);
            this.refreshWorkflowButtons(card);

            console.log('✅ Step 2: Follow-up completed');
        },

        // Step 3: Status Check
        step3_statusCheck(button, requestId) {
            this.showStatusCheckForm(button, requestId);
        },

        // Show status check form
        showStatusCheckForm(button, requestId) {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.5); z-index: 10000;
                display: flex; align-items: center; justify-content: center;
            `;

            modal.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 8px; max-width: 500px; width: 90%;">
                    <h3>🔍 Status Check</h3>
                    <form id="status-check-form">
                        <div style="margin: 10px 0;">
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Verification Method:</label>
                            <select id="verification-method" style="width: 100%; padding: 8px; border: 1px solid #ccc;">
                                <option value="docline_check">DOCLINE system check</option>
                                <option value="vendor_portal">Vendor portal check</option>
                                <option value="phone_call">Phone call verification</option>
                                <option value="email_inquiry">Email inquiry</option>
                                <option value="other">Other method</option>
                            </select>
                        </div>
                        <div style="margin: 10px 0;">
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Current Status:</label>
                            <select id="current-status" style="width: 100%; padding: 8px; border: 1px solid #ccc;">
                                <option value="in_queue">In Queue</option>
                                <option value="being_processed">Being Processed</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="unfilled">Unfilled</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div style="margin: 10px 0;">
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Status Details:</label>
                            <textarea id="status-details" style="width: 100%; height: 60px; padding: 8px; border: 1px solid #ccc;" 
                                      placeholder="Additional status information..."></textarea>
                        </div>
                        <div style="text-align: right; margin-top: 15px;">
                            <button type="button" onclick="this.closest('div').parentElement.remove()" 
                                    style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-right: 10px;">
                                Cancel
                            </button>
                            <button type="button" onclick="ILLWorkflow.saveStatusCheck('${requestId}', this)" 
                                    style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 4px;">
                                🔍 Complete Check
                            </button>
                        </div>
                    </form>
                </div>
            `;

            document.body.appendChild(modal);
        },

        // Save status check
        saveStatusCheck(requestId, button) {
            const verificationMethod = document.getElementById('verification-method').value;
            const currentStatus = document.getElementById('current-status').value;
            const statusDetails = document.getElementById('status-details').value;

            const card = document.querySelector(`[data-request-id="${requestId}"]`) || 
                        Array.from(document.querySelectorAll('.request-card')).find(c => 
                            this.extractRequestData(c).id === requestId);

            const settings = this.getSettings();
            const request = this.extractRequestData(card);

            // Generate status check proof email
            const email = this.fillTemplate(this.templates.statusCheck, {
                title: request.title,
                requestId: request.id,
                doclineNumber: request.workflow?.doclineNumber || 'N/A',
                checkDate: new Date().toLocaleDateString(),
                currentStatus: currentStatus,
                verificationMethod: verificationMethod,
                statusDetails: statusDetails || 'No additional details',
                actionRequired: this.getActionRequired(currentStatus),
                librarianName: settings.librarianName || 'Library Staff',
                timestamp: new Date().toLocaleString()
            });

            // Save workflow step
            const workflow = {
                ...request.workflow,
                statusChecked: true,
                statusCheckDate: new Date().toISOString(),
                verificationMethod: verificationMethod,
                currentStatus: currentStatus,
                statusDetails: statusDetails
            };

            this.saveWorkflowStep(card, workflow);
            button.closest('div').parentElement.remove(); // Close modal
            this.showEmailPopup('Status Check Proof Email', email);
            this.refreshWorkflowButtons(card);

            console.log('✅ Step 3: Status check completed');
        },

        // Step 4: Update Received
        step4_updateReceived(button, requestId) {
            this.showUpdateReceivedForm(button, requestId);
        },

        // Show update received form
        showUpdateReceivedForm(button, requestId) {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.5); z-index: 10000;
                display: flex; align-items: center; justify-content: center;
            `;

            modal.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 8px; max-width: 500px; width: 90%;">
                    <h3>📬 Update Received</h3>
                    <form id="update-received-form">
                        <div style="margin: 10px 0;">
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">New Status:</label>
                            <select id="new-status" style="width: 100%; padding: 8px; border: 1px solid #ccc;">
                                <option value="shipped">Shipped to Library</option>
                                <option value="delivered">Delivered</option>
                                <option value="ready_pickup">Ready for Pickup</option>
                                <option value="cancelled">Cancelled by Vendor</option>
                                <option value="unfilled">Cannot Fill</option>
                                <option value="delayed">Delayed</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div style="margin: 10px 0;">
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Update Details:</label>
                            <textarea id="update-details" style="width: 100%; height: 60px; padding: 8px; border: 1px solid #ccc;" 
                                      placeholder="Details from ILL department..."></textarea>
                        </div>
                        <div style="margin: 10px 0;">
                            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Expected Timeline:</label>
                            <input type="text" id="expected-timeline" style="width: 100%; padding: 8px; border: 1px solid #ccc;" 
                                   placeholder="e.g., 2-3 business days">
                        </div>
                        <div style="text-align: right; margin-top: 15px;">
                            <button type="button" onclick="this.closest('div').parentElement.remove()" 
                                    style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-right: 10px;">
                                Cancel
                            </button>
                            <button type="button" onclick="ILLWorkflow.saveUpdateReceived('${requestId}', this)" 
                                    style="background: #6f42c1; color: white; border: none; padding: 8px 16px; border-radius: 4px;">
                                📬 Complete Update
                            </button>
                        </div>
                    </form>
                </div>
            `;

            document.body.appendChild(modal);
        },

        // Save update received
        saveUpdateReceived(requestId, button) {
            const newStatus = document.getElementById('new-status').value;
            const updateDetails = document.getElementById('update-details').value;
            const expectedTimeline = document.getElementById('expected-timeline').value;

            if (!updateDetails) {
                alert('Please enter update details!');
                return;
            }

            const card = document.querySelector(`[data-request-id="${requestId}"]`) || 
                        Array.from(document.querySelectorAll('.request-card')).find(c => 
                            this.extractRequestData(c).id === requestId);

            const settings = this.getSettings();
            const request = this.extractRequestData(card);

            // Generate update received email
            const email = this.fillTemplate(this.templates.updateReceived, {
                title: request.title,
                requestId: request.id,
                doclineNumber: request.workflow?.doclineNumber || 'N/A',
                updateDate: new Date().toLocaleDateString(),
                newStatus: newStatus,
                updateDetails: updateDetails,
                nextSteps: this.getNextSteps(newStatus),
                expectedTimeline: expectedTimeline || 'TBD',
                librarianName: settings.librarianName || 'Library Staff',
                libraryName: settings.libraryName || 'Library',
                contactInfo: settings.contactInfo || 'library@institution.edu'
            });

            // Save workflow step
            const workflow = {
                ...request.workflow,
                updateReceived: true,
                updateDate: new Date().toISOString(),
                finalStatus: newStatus,
                updateDetails: updateDetails,
                expectedTimeline: expectedTimeline
            };

            this.saveWorkflowStep(card, workflow);
            button.closest('div').parentElement.remove(); // Close modal
            this.showEmailPopup('Update Received Email', email);
            this.refreshWorkflowButtons(card);

            console.log('✅ Step 4: Update received and processed');
        },

        // Helper functions
        needsFollowup(workflow) {
            if (!workflow.orderDate) return false;
            const orderDate = new Date(workflow.orderDate);
            const now = new Date();
            const daysDiff = (now - orderDate) / (1000 * 60 * 60 * 24);
            return daysDiff >= 5;
        },

        getActionRequired(status) {
            const actions = {
                'in_queue': 'Continue monitoring',
                'being_processed': 'Wait for completion',
                'shipped': 'Prepare for receipt',
                'delivered': 'Contact patron',
                'cancelled': 'Explore alternatives',
                'unfilled': 'Try alternative sources'
            };
            return actions[status] || 'Determine next steps';
        },

        getNextSteps(status) {
            const steps = {
                'shipped': 'Item will arrive at library within 2-3 business days',
                'delivered': 'Item is ready for pickup or will be delivered',
                'ready_pickup': 'Please come to the library to collect your item',
                'cancelled': 'We will explore alternative sources',
                'unfilled': 'We will try to locate from other libraries',
                'delayed': 'We will monitor and provide updates'
            };
            return steps[status] || 'We will keep you informed of progress';
        },

        extractRequestData(card) {
            const id = card.dataset.requestId || `req_${Date.now()}`;
            const title = card.querySelector('.request-title')?.textContent?.trim() || 'Unknown Title';
            const metaText = card.querySelector('.request-meta')?.textContent || '';
            
            return {
                id: id,
                title: title,
                authors: metaText.match(/Authors?: ([^•\n]+)/)?.[1]?.trim() || 'Unknown Authors',
                journal: metaText.match(/Journal?: ([^•\n]+)/)?.[1]?.trim() || 'Unknown Journal',
                workflow: this.getStoredWorkflow(id)
            };
        },

        saveWorkflowStep(card, workflow) {
            const requestId = this.extractRequestData(card).id;
            
            // Store in localStorage for persistence
            const key = `workflow_${requestId}`;
            localStorage.setItem(key, JSON.stringify(workflow));
            
            // Add to card dataset
            card.dataset.requestId = requestId;
        },

        getStoredWorkflow(requestId) {
            const key = `workflow_${requestId}`;
            const stored = localStorage.getItem(key);
            return stored ? JSON.parse(stored) : {};
        },

        addWorkflowStamps(container, workflow) {
            let stamps = '';
            
            if (workflow.orderPlaced) {
                stamps += `<div class="workflow-stamp">✅ Order placed ${new Date(workflow.orderDate).toLocaleDateString()} - DOCLINE: ${workflow.doclineNumber}</div>`;
            }
            if (workflow.followupCompleted) {
                stamps += `<div class="workflow-stamp">📞 Follow-up completed ${new Date(workflow.followupDate).toLocaleDateString()}</div>`;
            }
            if (workflow.statusChecked) {
                stamps += `<div class="workflow-stamp">🔍 Status checked ${new Date(workflow.statusCheckDate).toLocaleDateString()}</div>`;
            }
            if (workflow.updateReceived) {
                stamps += `<div class="workflow-stamp">📬 Update received ${new Date(workflow.updateDate).toLocaleDateString()}</div>`;
            }
            
            container.innerHTML += stamps;
        },

        refreshWorkflowButtons(card) {
            const existing = card.querySelector('.workflow-buttons');
            if (existing) {
                existing.remove();
            }
            this.addWorkflowToCard(card);
        },

        startReminderSystem() {
            // Check for reminders every hour
            setInterval(() => {
                this.checkReminders();
            }, 3600000);
            
            // Initial check
            setTimeout(() => this.checkReminders(), 2000);
        },

        checkReminders() {
            document.querySelectorAll('.request-card').forEach(card => {
                const requestData = this.extractRequestData(card);
                if (requestData.workflow && this.needsFollowup(requestData.workflow) && !requestData.workflow.followupCompleted) {
                    this.refreshWorkflowButtons(card);
                }
            });
        },

        setupEventListeners() {
            // Refresh workflow when requests are updated
            document.addEventListener('requestUpdated', (event) => {
                setTimeout(() => this.checkReminders(), 1000);
            });
        },

        showEmailPopup(title, content) {
            const popup = document.createElement('div');
            popup.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.5); z-index: 10000;
                display: flex; align-items: center; justify-content: center;
            `;

            popup.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 8px; max-width: 600px; width: 90%;">
                    <h3>${title}</h3>
                    <textarea readonly style="width: 100%; height: 300px; font-family: monospace; font-size: 12px; padding: 10px; border: 1px solid #ccc;">${content}</textarea>
                    <div
