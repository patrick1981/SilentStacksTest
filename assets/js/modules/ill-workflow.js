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
                    cursor: pointer;
                    margin-right: 8px;
                    font-size: 0.85rem;
                    transition: all 0.3s ease;
                }
                
                .workflow-btn:hover {
                    background: #0056b3;
                    transform: translateY(-1px);
                }
                
                .workflow-btn.completed {
                    background: #28a745;
                }
                
                .workflow-stamp {
                    font-size: 0.8rem;
                    color: #666;
                    padding: 4px 8px;
                    background: #f8f9fa;
                    border-radius: 4px;
                    margin: 4px 0;
                    display: inline-block;
                }
                
                .reminder-badge {
                    background: #ff6347;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.75rem;
                    margin-left: 8px;
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.6; }
                }
                
                .workflow-buttons {
                    margin-top: 10px;
                    padding-top: 10px;
                    border-top: 1px solid #e0e0e0;
                }
                
                .docline-input {
                    padding: 4px 8px;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    margin-right: 8px;
                }
            `;
            document.head.appendChild(style);
            
            // Add workflow buttons to existing request cards
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeWorkflowButtons();
            });
        },

        initializeWorkflowButtons() {
            const requestCards = document.querySelectorAll('.request-card');
            requestCards.forEach(card => this.addWorkflowToCard(card));
        },

        addWorkflowToCard(card) {
            if (card.querySelector('.workflow-buttons')) return;
            
            const requestData = this.extractRequestData(card);
            if (!requestData) return;
            
            const workflowDiv = document.createElement('div');
            workflowDiv.className = 'workflow-buttons';
            
            const workflow = this.getWorkflowState(requestData.id);
            
            // Step 1: Place Order
            let step1HTML = '';
            if (!workflow.orderPlaced) {
                step1HTML = `
                    <div style="margin: 4px 0;">
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
            if (workflow.orderPlaced && !workflow.statusChecked) {
                step3HTML = `
                    <button class="workflow-btn step3" onclick="ILLWorkflow.step3_statusCheck(this, '${requestData.id}')">
                        🔍 3. Status Check
                    </button>
                `;
            }

            // Step 4: Update Received
            let step4HTML = '';
            if (workflow.orderPlaced && !workflow.updateReceived) {
                step4HTML = `
                    <button class="workflow-btn step4" onclick="ILLWorkflow.step4_updateReceived(this, '${requestData.id}')">
                        📬 4. Update Received
                    </button>
                `;
            }

            workflowDiv.innerHTML = step1HTML + step2HTML + step3HTML + step4HTML;
            
            // Add workflow stamps
            this.addWorkflowStamps(workflowDiv, workflow);
            
            card.appendChild(workflowDiv);
        },

        extractRequestData(card) {
            try {
                const titleEl = card.querySelector('.request-title, h3');
                const journalEl = card.querySelector('.request-journal, .journal');
                const authorsEl = card.querySelector('.request-authors, .authors');
                const idEl = card.querySelector('[data-request-id]');
                
                return {
                    id: idEl?.dataset.requestId || card.dataset.requestId || Math.random().toString(36).substr(2, 9),
                    title: titleEl?.textContent || 'Unknown Title',
                    journal: journalEl?.textContent || 'Unknown Journal',
                    authors: authorsEl?.textContent || 'Unknown Authors',
                    workflow: this.getWorkflowState(idEl?.dataset.requestId || card.dataset.requestId)
                };
            } catch (error) {
                console.error('Error extracting request data:', error);
                return null;
            }
        },

        needsFollowup(workflow) {
            if (!workflow.orderDate) return false;
            const daysSinceOrder = (Date.now() - new Date(workflow.orderDate).getTime()) / (1000 * 60 * 60 * 24);
            return daysSinceOrder >= 5;
        },

        getWorkflowState(requestId) {
            const stored = localStorage.getItem(`workflow_${requestId}`);
            return stored ? JSON.parse(stored) : {};
        },

        saveWorkflowStep(card, workflow) {
            const requestData = this.extractRequestData(card);
            if (!requestData) return;
            
            localStorage.setItem(`workflow_${requestData.id}`, JSON.stringify(workflow));
            this.refreshWorkflowButtons(card);
        },

        // Step 1: Place Order
        step1_placeOrder(button, requestId) {
            const doclineInput = document.getElementById(`docline-${requestId}`);
            const doclineNumber = doclineInput?.value.trim();
            
            if (!doclineNumber) {
                alert('Please enter DOCLINE number');
                return;
            }

            const card = button.closest('.request-card');
            const requestData = this.extractRequestData(card);
            const settings = this.getSettings();

            // Generate patron email
            const patronEmail = this.fillTemplate(this.templates.orderPlaced, {
                title: requestData.title,
                authors: requestData.authors,
                journal: requestData.journal,
                doclineNumber: doclineNumber,
                dateOrdered: new Date().toLocaleDateString(),
                requestId: requestData.id,
                librarianName: settings.librarianName || 'Library Staff',
                libraryName: settings.libraryName || 'Library',
                contactInfo: settings.contactInfo || 'library@institution.edu'
            });

            // Save workflow step
            const workflow = {
                orderPlaced: true,
                orderDate: new Date().toISOString(),
                doclineNumber: doclineNumber
            };

            this.saveWorkflowStep(card, workflow);
            this.showEmailPopup('Order Confirmation Email', patronEmail);
            
            console.log('✅ Step 1: Order placed');
        },

        // Step 2: Follow-up
        step2_followUp(button, requestId) {
            this.showFollowupForm(button, requestId);
        },

        showFollowupForm(button, requestId) {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.5); z-index: 10000;
                display: flex; align-items: center; justify-content: center;
            `;

            modal.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 8px; max-width: 500px; width: 90%;">
                    <h3>Follow-up Details</h3>
                    <form>
                        <div style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px;">Action Taken:</label>
                            <select id="followup-action" style="width: 100%; padding: 8px;">
                                <option value="phone">Phone Call to Lending Library</option>
                                <option value="email">Email to Lending Library</option>
                                <option value="docline">DOCLINE Message Sent</option>
                                <option value="patron">Patron Update Sent</option>
                            </select>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px;">Status Update:</label>
                            <textarea id="followup-status" rows="3" style="width: 100%; padding: 8px;" 
                                      placeholder="Current status and any issues..."></textarea>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px;">Next Action:</label>
                            <input type="text" id="followup-next" style="width: 100%; padding: 8px;" 
                                   placeholder="What needs to happen next?">
                        </div>
                        <div style="text-align: right; margin-top: 15px;">
                            <button type="button" onclick="this.closest('div').parentElement.remove()" 
                                    style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-right: 10px;">
                                Cancel
                            </button>
                            <button type="button" onclick="ILLWorkflow.saveFollowup('${requestId}', this)" 
                                    style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 4px;">
                                📞 Complete Follow-up
                            </button>
                        </div>
                    </form>
                </div>
            `;

            document.body.appendChild(modal);
        },

        saveFollowup(requestId, button) {
            const actionTaken = document.getElementById('followup-action').value;
            const statusUpdate = document.getElementById('followup-status').value;
            const nextAction = document.getElementById('followup-next').value;

            if (!statusUpdate) {
                alert('Please provide a status update');
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

        showStatusCheckForm(button, requestId) {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.5); z-index: 10000;
                display: flex; align-items: center; justify-content: center;
            `;

            modal.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 8px; max-width: 500px; width: 90%;">
                    <h3>Status Check Details</h3>
                    <form>
                        <div style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px;">Verification Method:</label>
                            <select id="verification-method" style="width: 100%; padding: 8px;">
                                <option value="docline">DOCLINE System Check</option>
                                <option value="phone">Phone Verification</option>
                                <option value="email">Email Confirmation</option>
                                <option value="portal">Library Portal Check</option>
                            </select>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px;">Current Status:</label>
                            <select id="current-status" style="width: 100%; padding: 8px;">
                                <option value="processing">Still Processing</option>
                                <option value="shipped">Shipped/In Transit</option>
                                <option value="available">Available for Download</option>
                                <option value="delayed">Delayed</option>
                                <option value="cancelled">Cancelled by Lender</option>
                            </select>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px;">Additional Details:</label>
                            <textarea id="status-details" rows="3" style="width: 100%; padding: 8px;" 
                                      placeholder="Any additional information..."></textarea>
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
                lastStatus: currentStatus,
                verificationMethod: verificationMethod
            };

            this.saveWorkflowStep(card, workflow);
            button.closest('div').parentElement.remove(); // Close modal
            this.showEmailPopup('Status Check Proof Email', email);
            this.refreshWorkflowButtons(card);

            console.log('✅ Step 3: Status check completed');
        },

        // Step 4: Update Received
        step4_updateReceived(button, requestId) {
            this.showUpdateForm(button, requestId);
        },

        showUpdateForm(button, requestId) {
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                background: rgba(0,0,0,0.5); z-index: 10000;
                display: flex; align-items: center; justify-content: center;
            `;

            modal.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 8px; max-width: 500px; width: 90%;">
                    <h3>Update Received</h3>
                    <form>
                        <div style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px;">Update Type:</label>
                            <select id="update-type" style="width: 100%; padding: 8px;">
                                <option value="delivered">Document Delivered</option>
                                <option value="delayed">Delay Notification</option>
                                <option value="unavailable">Cannot Supply</option>
                                <option value="alternative">Alternative Suggested</option>
                            </select>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px;">Update Details:</label>
                            <textarea id="update-details" rows="3" style="width: 100%; padding: 8px;" 
                                      placeholder="Specific details about the update..."></textarea>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <label style="display: block; margin-bottom: 5px;">Next Steps:</label>
                            <input type="text" id="next-steps" style="width: 100%; padding: 8px;" 
                                   placeholder="What happens next?">
                        </div>
                        <div style="text-align: right; margin-top: 15px;">
                            <button type="button" onclick="this.closest('div').parentElement.remove()" 
                                    style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; margin-right: 10px;">
                                Cancel
                            </button>
                            <button type="button" onclick="ILLWorkflow.saveUpdate('${requestId}', this)" 
                                    style="background: #17a2b8; color: white; border: none; padding: 8px 16px; border-radius: 4px;">
                                📬 Send Update
                            </button>
                        </div>
                    </form>
                </div>
            `;

            document.body.appendChild(modal);
        },

        saveUpdate(requestId, button) {
            const updateType = document.getElementById('update-type').value;
            const updateDetails = document.getElementById('update-details').value;
            const nextSteps = document.getElementById('next-steps').value;

            if (!updateDetails) {
                alert('Please provide update details');
                return;
            }

            const card = document.querySelector(`[data-request-id="${requestId}"]`) || 
                        Array.from(document.querySelectorAll('.request-card')).find(c => 
                            this.extractRequestData(c).id === requestId);

            const settings = this.getSettings();
            const request = this.extractRequestData(card);

            // Generate update email for patron
            const email = this.fillTemplate(this.templates.updateReceived, {
                title: request.title,
                requestId: request.id,
                doclineNumber: request.workflow?.doclineNumber || 'N/A',
                updateDate: new Date().toLocaleDateString(),
                newStatus: updateType,
                updateDetails: updateDetails,
                nextSteps: nextSteps || 'No further action required',
                expectedTimeline: this.getExpectedTimeline(updateType),
                librarianName: settings.librarianName || 'Library Staff',
                libraryName: settings.libraryName || 'Library',
                contactInfo: settings.contactInfo || 'library@institution.edu'
            });

            // Save workflow step
            const workflow = {
                ...request.workflow,
                updateReceived: true,
                updateDate: new Date().toISOString(),
                updateType: updateType,
                updateDetails: updateDetails
            };

            this.saveWorkflowStep(card, workflow);
            button.closest('div').parentElement.remove(); // Close modal
            this.showEmailPopup('Update Email to Patron', email);
            this.refreshWorkflowButtons(card);

            console.log('✅ Step 4: Update sent to patron');
        },

        // Helper functions
        getActionRequired(status) {
            const actions = {
                'processing': 'Continue monitoring',
                'shipped': 'Prepare to receive document',
                'available': 'Download and deliver to patron',
                'delayed': 'Notify patron of delay',
                'cancelled': 'Find alternative source'
            };
            return actions[status] || 'Follow standard procedure';
        },

        getExpectedTimeline(updateType) {
            const timelines = {
                'delivered': 'Document ready for patron',
                'delayed': 'Additional 3-5 business days',
                'unavailable': 'Seeking alternative sources',
                'alternative': 'Varies based on source'
            };
            return timelines[updateType] || 'To be determined';
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
                    <div style="text-align: right; margin-top: 15px;">
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

})();
