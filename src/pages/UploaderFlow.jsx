import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, uploadFile } from '../lib/supabase';
import { ArrowLeft, ArrowRight, Check, Upload, X } from 'lucide-react';

const DEPARTMENTS = [
  'Engineering', 'Product', 'Design', 'Marketing', 'Sales', 
  'Customer Success', 'Operations', 'Finance', 'HR', 'Legal', 'Other'
];

const TOOLS = [
  'Jira', 'Slack', 'Figma', 'GitHub', 'Google Workspace', 
  'Salesforce', 'HubSpot', 'Notion', 'Confluence', 'Asana'
];

const SKILLS = [
  'Technical/Coding', 'Communication', 'Project Management', 'Problem Solving',
  'Leadership', 'Data Analysis', 'Design', 'Writing', 'Presentation', 'Negotiation'
];

const COMMUNICATION_METHODS = [
  'Daily standups', 'Weekly 1-on-1s', 'Slack channels', 'Email updates',
  'Team retrospectives', 'Documentation', 'Video calls', 'In-person meetings'
];

function UploaderFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0 = code entry, 1-5 = questionnaire steps
  const [code, setCode] = useState('');
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form data
  const [formData, setFormData] = useState({
    positionLevel: '',
    department: '',
    experience: '',
    teamSize: '',
    mainResponsibilities: ['', '', ''],
    essentialTools: [],
    customTools: '',
    criticalSkills: [],
    learningPath: '',
    commonProblems: '',
    solutions: '',
    communicationMethods: [],
    collaborationTips: '',
    handoffAdvice: '',
    finalAdvice: '',
    allowFollowup: false,
    processFiles: [],
    templateFiles: [],
    exampleFiles: []
  });

  const validateCode = async () => {
    if (!code.trim()) {
      setCodeError('Please enter an upload code');
      return;
    }

    setValidatingCode(true);
    setCodeError('');

    try {
      const { data, error } = await supabase
        .from('upload_codes')
        .select('*')
        .eq('code', code.trim())
        .single();

      if (error || !data) {
        throw new Error('Invalid or expired code');
      }

      if (data.used) {
        throw new Error('This code has already been used');
      }

      if (new Date(data.expires_at) < new Date()) {
        throw new Error('This code has expired');
      }

      // Code is valid, proceed to step 1
      setStep(1);
    } catch (err) {
      setCodeError(err.message);
    } finally {
      setValidatingCode(false);
    }
  };

  const handleFileUpload = async (files, category) => {
    const uploadedFiles = [];
    
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const bucket = category === 'process' ? 'process-documents' 
                   : category === 'template' ? 'templates' 
                   : 'examples';

      try {
        await uploadFile(bucket, file, fileName);
        uploadedFiles.push(fileName);
      } catch (error) {
        console.error('File upload error:', error);
        // THROW error to stop the process instead of just alerting
        throw new Error(`Failed to upload ${file.name}. Please try again.`);
      }
    }

    return uploadedFiles;
  };

  const handleSubmit = async (e) => {
    // Prevent any default form submission
    if (e) e.preventDefault();
    
    setSubmitting(true);

    try {
      // 1. Upload files first
      let processFileNames = [];
      let templateFileNames = [];
      let exampleFileNames = [];

      try {
        if (formData.processFiles.length > 0) {
           processFileNames = await handleFileUpload(formData.processFiles, 'process');
        }
        if (formData.templateFiles.length > 0) {
           templateFileNames = await handleFileUpload(formData.templateFiles, 'template');
        }
        if (formData.exampleFiles.length > 0) {
           exampleFileNames = await handleFileUpload(formData.exampleFiles, 'example');
        }
      } catch (uploadError) {
        alert(uploadError.message);
        setSubmitting(false);
        return; // STOP HERE if upload fails
      }

      // Combine selected and custom tools
      const allTools = [...formData.essentialTools];
      if (formData.customTools.trim()) {
        allTools.push(formData.customTools.trim());
      }

      // 2. Insert submission
      const { data: submission, error: insertError } = await supabase
        .from('knowledge_submissions')
        .insert({
          upload_code: code.trim(),
          position_level: formData.positionLevel,
          department: formData.department,
          experience_range: formData.experience,
          team_size_range: formData.teamSize,
          main_responsibilities: formData.mainResponsibilities.filter(r => r.trim()),
          essential_tools: allTools,
          critical_skills: formData.criticalSkills,
          learning_resources: formData.learningPath,
          common_problems: formData.commonProblems,
          solutions: formData.solutions,
          communication_methods: formData.communicationMethods,
          collaboration_tips: formData.collaborationTips,
          handoff_advice: formData.handoffAdvice,
          final_advice: formData.finalAdvice,
          allow_followup: formData.allowFollowup,
          process_files: processFileNames,
          template_files: templateFileNames,
          example_files: exampleFileNames,
          status: 'pending'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 3. Mark code as used
      // (Ideally handled by database trigger, but good to be safe)
      await supabase
        .from('upload_codes')
        .update({ used: true, used_at: new Date().toISOString() })
        .eq('code', code.trim());

      // 4. Trigger AI processing via Edge Function
      const { error: functionError } = await supabase.functions.invoke('process-knowledge', {
        body: { submission_id: submission.id }
      });

      if (functionError) {
        console.error('AI processing error:', functionError);
        // Don't fail the submission if AI processing fails
      }

      // Show success and end session
      setStep(6);
    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 0: Code Entry
  if (step === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-8"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Home
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Upload className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">
              Knowledge Upload
            </h1>
            <p className="text-center text-gray-600 mb-8">
              Enter your one-time upload code to begin
            </p>

            {codeError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{codeError}</p>
              </div>
            )}

            <div className="mb-6">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter your code"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-lg font-mono"
                onKeyPress={(e) => e.key === 'Enter' && validateCode()}
              />
            </div>

            <button
              onClick={validateCode}
              disabled={validatingCode}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {validatingCode ? 'Validating...' : 'Continue'}
            </button>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> This is a one-time, anonymous upload. No personal information will be stored.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 6: Success
  if (step === 6) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Thank You!
          </h1>
          <p className="text-gray-600 mb-8">
            Your knowledge has been submitted successfully. It will be reviewed and made available to the team soon.
          </p>
          <p className="text-sm text-gray-500">
            This session has ended. You can now close this window.
          </p>
        </div>
      </div>
    );
  }

  // Steps 1-5: Questionnaire
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Step {step} of 5</span>
            <span className="text-sm text-gray-500">{Math.round((step / 5) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Step 1: Role Context */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Role Context</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Position Level *
                </label>
                <select
                  value={formData.positionLevel}
                  onChange={(e) => setFormData({ ...formData, positionLevel: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select level</option>
                  <option value="Junior">Junior</option>
                  <option value="Mid-level">Mid-level</option>
                  <option value="Senior">Senior</option>
                  <option value="Lead">Lead</option>
                  <option value="Manager">Manager</option>
                  <option value="Director">Director</option>
                  <option value="Executive">Executive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department *
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select department</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time in Role *
                </label>
                <select
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select experience</option>
                  <option value="<6 months">&lt;6 months</option>
                  <option value="6-12 months">6-12 months</option>
                  <option value="1-2 years">1-2 years</option>
                  <option value="2-5 years">2-5 years</option>
                  <option value="5+ years">5+ years</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Team Size *
                </label>
                <div className="space-y-2">
                  {['Just me', '2-5', '6-10', '11-20', '20+'].map(size => (
                    <label key={size} className="flex items-center">
                      <input
                        type="radio"
                        name="teamSize"
                        value={size}
                        checked={formData.teamSize === size}
                        onChange={(e) => setFormData({ ...formData, teamSize: e.target.value })}
                        className="mr-3"
                      />
                      <span className="text-gray-700">{size}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Work Processes */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Work Processes</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Main Responsibilities (List your 3 most important regular tasks) *
                </label>
                {formData.mainResponsibilities.map((resp, index) => (
                  <input
                    key={index}
                    type="text"
                    value={resp}
                    onChange={(e) => {
                      const newResp = [...formData.mainResponsibilities];
                      newResp[index] = e.target.value;
                      setFormData({ ...formData, mainResponsibilities: newResp });
                    }}
                    placeholder={`Responsibility ${index + 1}`}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-3"
                    required
                  />
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Process Documents (Upload any guides, SOPs, checklists)
                </label>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,.md"
                  onChange={(e) => setFormData({ ...formData, processFiles: Array.from(e.target.files) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {formData.processFiles.length > 0 && (
                  <p className="mt-2 text-sm text-gray-600">
                    {formData.processFiles.length} file(s) selected
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Essential Tools (Select all that apply)
                </label>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  {TOOLS.map(tool => (
                    <label key={tool} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.essentialTools.includes(tool)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ 
                              ...formData, 
                              essentialTools: [...formData.essentialTools, tool] 
                            });
                          } else {
                            setFormData({ 
                              ...formData, 
                              essentialTools: formData.essentialTools.filter(t => t !== tool) 
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{tool}</span>
                    </label>
                  ))}
                </div>
                <input
                  type="text"
                  value={formData.customTools}
                  onChange={(e) => setFormData({ ...formData, customTools: e.target.value })}
                  placeholder="Other tools (comma separated)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Step 3: Skills & Knowledge */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Skills & Knowledge</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Critical Skills (Select all that apply) *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {SKILLS.map(skill => (
                    <label key={skill} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.criticalSkills.includes(skill)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ 
                              ...formData, 
                              criticalSkills: [...formData.criticalSkills, skill] 
                            });
                          } else {
                            setFormData({ 
                              ...formData, 
                              criticalSkills: formData.criticalSkills.filter(s => s !== skill) 
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{skill}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Learning Path (What helped you learn fastest?) *
                </label>
                <textarea
                  value={formData.learningPath}
                  onChange={(e) => setFormData({ ...formData, learningPath: e.target.value })}
                  placeholder="Share resources, courses, mentors, or methods that accelerated your learning..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-32"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Common Problems & Solutions *
                </label>
                <textarea
                  value={formData.commonProblems}
                  onChange={(e) => setFormData({ ...formData, commonProblems: e.target.value })}
                  placeholder="What challenges did you face frequently?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24 mb-3"
                  required
                />
                <textarea
                  value={formData.solutions}
                  onChange={(e) => setFormData({ ...formData, solutions: e.target.value })}
                  placeholder="How did you solve them?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24"
                  required
                />
              </div>
            </div>
          )}

          {/* Step 4: Team Collaboration */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Team Collaboration</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Effective Communication Methods (Select all that apply) *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {COMMUNICATION_METHODS.map(method => (
                    <label key={method} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.communicationMethods.includes(method)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ 
                              ...formData, 
                              communicationMethods: [...formData.communicationMethods, method] 
                            });
                          } else {
                            setFormData({ 
                              ...formData, 
                              communicationMethods: formData.communicationMethods.filter(m => m !== method) 
                            });
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-700">{method}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Collaboration Tips *
                </label>
                <textarea
                  value={formData.collaborationTips}
                  onChange={(e) => setFormData({ ...formData, collaborationTips: e.target.value })}
                  placeholder="Share insights on working effectively with your team..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-32"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Handoff Advice *
                </label>
                <textarea
                  value={formData.handoffAdvice}
                  onChange={(e) => setFormData({ ...formData, handoffAdvice: e.target.value })}
                  placeholder="What should your replacement know about transitioning into this role?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-32"
                  required
                />
              </div>
            </div>
          )}

          {/* Step 5: Final Contributions */}
          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Final Contributions</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Useful Templates (Upload any templates you created)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setFormData({ ...formData, templateFiles: Array.from(e.target.files) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {formData.templateFiles.length > 0 && (
                  <p className="mt-2 text-sm text-gray-600">
                    {formData.templateFiles.length} file(s) selected
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Anonymized Work Examples (Remove any names/identifiers)
                </label>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setFormData({ ...formData, exampleFiles: Array.from(e.target.files) })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {formData.exampleFiles.length > 0 && (
                  <p className="mt-2 text-sm text-gray-600">
                    {formData.exampleFiles.length} file(s) selected
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Key Advice (Most important thing for the next person) *
                </label>
                <textarea
                  value={formData.finalAdvice}
                  onChange={(e) => setFormData({ ...formData, finalAdvice: e.target.value })}
                  placeholder="If you could share one piece of advice with your replacement, what would it be?"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-32"
                  required
                />
              </div>

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.allowFollowup}
                    onChange={(e) => setFormData({ ...formData, allowFollowup: e.target.checked })}
                    className="mr-3"
                  />
                  <span className="text-sm text-gray-700">
                    I'm open to anonymous follow-up questions (admin will coordinate)
                  </span>
                </label>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-900">
                  <strong>Privacy Notice:</strong> All information submitted is anonymous. Files will be renamed to remove identifiers. Please ensure you haven't included any personal information in your responses.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="flex items-center px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Previous
              </button>
            )}
            
            {step < 5 ? (
              <button
                type="button"
                onClick={() => {
                  // Basic validation
                  if (step === 1 && (!formData.positionLevel || !formData.department || !formData.experience || !formData.teamSize)) {
                    alert('Please fill in all required fields');
                    return;
                  }
                  if (step === 2 && formData.mainResponsibilities.filter(r => r.trim()).length < 3) {
                    alert('Please provide all 3 main responsibilities');
                    return;
                  }
                  if (step === 3 && (!formData.criticalSkills.length || !formData.learningPath || !formData.commonProblems || !formData.solutions)) {
                    alert('Please fill in all required fields');
                    return;
                  }
                  if (step === 4 && (!formData.communicationMethods.length || !formData.collaborationTips || !formData.handoffAdvice)) {
                    alert('Please fill in all required fields');
                    return;
                  }
                  setStep(step + 1);
                }}
                className="ml-auto flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                Next
                <ArrowRight className="w-5 h-5 ml-2" />
              </button>
            ) : (
              <button
                type="button" // CRITICAL: Prevent default form submission
                onClick={handleSubmit}
                disabled={submitting || !formData.finalAdvice}
                className="ml-auto flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Knowledge'}
                <Check className="w-5 h-5 ml-2" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default UploaderFlow;