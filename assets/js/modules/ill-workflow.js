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

        initialize() {
            console.log('📋 Loading ILL Workflow System...');
            this.addWorkflowUI();
            this.startReminderSystem();
            this.setupEventListeners();
        },

        addWorkflowUI() {
            const style = document.createElement('style');
            style.textContent = `
                .workflow-btn { background: #007bff; color: white; border: none; padding: 6px 12px; border-radius: 4px; font-size: 11px; cursor: pointer; margin: 2px; }
                .workflow-btn.step1 { background: #28a745; }
                .workflow-btn.step2 { background: #ffc107; color: #000; }
                .workflow-btn.step3 { background: #dc3545; }
                .workflow-btn.step4 { background: #6f42c1; }
                .workflow-btn:hover { opacity: 0.8; }
                .workflow-stamp { background: #e8f4fd; border: 1px solid #007bff; padding: 6px 10px; margin: 4px 0; border-radius: 4px; font-size: 10px; }
                .reminder-badge { background: #dc3545; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold; animation: pulse 2s infinite; }
                @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
                .docline-input { width: 150px; padding: 4px 8px; border: 1px solid #ccc; border-radius: 3px; font-size: 11px; margin: 2px; }
            `;
            document.head.appendChild(style);
            this.observeRequestCards();
        },

        observeRequestCards() {
            const observer = new MutationObserver(mutations => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === 1 && node.classList.contains('request-card')) {
                            this.addWorkflowToCard(node);
                        }
                    });
                });
            });
            const requestList = document.getElementById('request-list');
            if (requestList) observer.observe(requestList, { childList: true, subtree: true });
            setTimeout(() => {
                document.querySelectorAll('.request-card').forEach(card => this.addWorkflowToCard(card));
            }, 1000);
        },

        addWorkflowToCard(card) {
            if (card.querySelector('.workflow-buttons')) return;
            const requestData = this.extractRequestData(card);
            const workflow = requestData.workflow || {};
            const container = document.createElement('div');
            container.className = 'workflow-buttons';
            container.style.marginTop = '10px';
            container.style.borderTop = '1px solid #eee';
            container.style.paddingTop = '8px';

            let step1HTML = '';
            if (!workflow.orderPlaced) {
                step1HTML = `
                    <div style="margin: 4px 0;">
                        <input type="text" class="docline-input" placeholder="DOCLINE Number" id="docline-${requestData.id}">
                        <button class="workflow-btn step1" onclick="ILLWorkflow.step1_placeOrder(this, '${requestData.id}')">
                            📤 1. Place Order
                        </button>
                    </div>`;
            }

            let step2HTML = '';
            if (workflow.orderPlaced && this.needsFollowup(workflow) && !workflow.followupCompleted) {
                step2HTML = `
                    <div style="margin: 4px 0;">
                        <span class="reminder-badge">5+ DAYS - FOLLOW-UP NEEDED</span>
                        <button class="workflow-btn step2" onclick="ILLWorkflow.step2_followUp(this, '${requestData.id}')">
                            📞 2. Follow Up
                        </button>
                    </div>`;
            }

            let step3HTML = '';
            if (workflow.followupCompleted && !workflow.statusChecked) {
                step3HTML = `
                    <div style="margin: 4px 0;">
                        <button class="workflow-btn step3" onclick="ILLWorkflow.step3_statusCheck(this, '${requestData.id}')">
                            🔍 3. Check Status
                        </button>
                    </div>`;
            }

            let step4HTML = '';
            if (workflow.statusChecked && !workflow.updateReceived) {
                step4HTML = `
                    <div style="margin: 4px 0;">
                        <button class="workflow-btn step4" onclick="ILLWorkflow.step4_updateReceived(this, '${requestData.id}')">
                            📬 4. Update Received
                        </button>
                    </div>`;
            }

            container.innerHTML = step1HTML + step2HTML + step3HTML + step4HTML;
            this.addWorkflowStamps(container, workflow);
            card.appendChild(container);
        },

        fillTemplate(template, data) {
            return template.replace(/\{(\w+)\}/g, (match, key) => data[key] || match);
        },

        getSettings() {
            if (!this.settings) {
                const defaults = { librarianName: 'Library Staff', libraryName: 'Library', contactInfo: 'library@institution.edu' };
                this.settings = { ...defaults, ...(window.SilentStacks?.modules?.DataManager?.getSettings()?.paperTrail || {}) };
            }
            return this.settings;
        },

        step1_placeOrder(button, requestId) {
            const docInput = document.getElementById(`docline-${requestId}`);
            const doclineNumber = docInput?.value.trim();
            if (!doclineNumber) { alert('Please enter the DOCLINE number first!'); docInput?.focus(); return; }

            const card = button.closest('.request-card');
            const request = this.extractRequestData(card);
            const settings = this.getSettings();
            const email = this.fillTemplate(this.templates.orderPlaced, {
                title: request.title,
                authors: request.authors,
                journal: request.journal,
                doclineNumber,
                dateOrdered: new Date().toLocaleString(),
                requestId,
                librarianName: settings.librarianName,
                libraryName: settings.libraryName,
                contactInfo: settings.contactInfo
            });

            const workflow = { orderPlaced: true, orderDate: new Date().toISOString(), doclineNumber, librarianName: settings.librarianName };
            this.saveWorkflowStep(card, workflow);
            this.showEmailPopup('Order Confirmation Email', email);
            this.refreshWorkflowButtons(card);
            console.log('✅ Step 1: Order placed with DOCLINE:', doclineNumber);
        },

        step2_followUp(button, requestId) { this.showFollowUpForm(button, requestId); },

        showFollowUpForm(button, requestId) {
            const modal = document.createElement('div');
            modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:10000;display:flex;align-items:center;justify-content:center;';
            modal.innerHTML = `
                <div style="background:white;padding:20px;border-radius:8px;max-width:500px;width:90%;">
