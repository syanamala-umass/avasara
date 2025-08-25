import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, DollarSign, Target, CheckCircle, ArrowRight, ArrowLeft, XCircle, Save } from 'lucide-react';
import { createTask, saveTaskDraft, fetchSkills, createSkill } from './api';
import ReactMarkdown from 'react-markdown';
import { Editor, EditorState, convertToRaw, convertFromRaw } from 'draft-js';
import 'draft-js/dist/Draft.css';

// Custom CSS for Draft.js editor
const customStyles = `
  .DraftEditor-root {
    min-height: 200px;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    background: white;
  }
  
  .DraftEditor-editorContainer {
    min-height: 200px;
  }
  
  .public-DraftEditor-content {
    min-height: 200px;
    padding: 1rem 1.25rem;
    font-size: 1rem;
    line-height: 1.5;
    color: #1f2937;
    outline: none;
  }
  
  .public-DraftEditorPlaceholder-root {
    color: #9ca3af;
    position: absolute;
    pointer-events: none;
    padding: 1rem 1.25rem;
  }
  

`;

const DispatchTaskModal = ({ isOpen, onClose, onTaskCreated }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    category: '',
    title: '',
    description: '',
    compensation_type: 'cash',
    compensation_amount: 0,
    review_compensation_type: 'cash',
    review_compensation_amount: 0,
    skills: [],
    num_reviewers: 2,
    skill_review_requirements: {},  // {"skill_name": min_skill_level_required}
    // Duration field
    task_duration: null
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableSkills, setAvailableSkills] = useState([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);
  const [allowSubmission, setAllowSubmission] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);

  const skillDropdownRef = useRef(null);
  const skillInputRef = useRef(null);
  const [descriptionTemplate, setDescriptionTemplate] = useState('');
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);
  
  // Draft.js rich text editor state
  const [editorState, setEditorState] = useState(EditorState.createEmpty());
  const editorRef = useRef(null);

  useEffect(() => {
    const loadSkills = async () => {
      try {
        const response = await fetchSkills();
        setAvailableSkills(response.data);
      } catch (err) {
        console.error('Error loading skills:', err);
      }
    };
    loadSkills();
  }, []);



  useEffect(() => {
    if (!showSkillDropdown) return;
    function handleClickOutside(event) {
      if (
        skillDropdownRef.current &&
        !skillDropdownRef.current.contains(event.target) &&
        skillInputRef.current &&
        !skillInputRef.current.contains(event.target)
      ) {
        setShowSkillDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSkillDropdown]);

     









  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowCloseConfirmation(true);
    } else {
      onClose();
    }
  };

  const handleConfirmClose = () => {
    setShowCloseConfirmation(false);
    setHasUnsavedChanges(false);
    onClose();
  };

  const handleCancelClose = () => {
    setShowCloseConfirmation(false);
  };

  const handleSaveDraft = async () => {
    setDraftSaving(true);
    setError('');

    try {
      // Ensure all skills have valid database IDs
      const validSkills = formData.skills.filter(skill => {
        return typeof skill.id === 'number' && skill.id > 0;
      });

      // Convert Draft.js content to HTML for submission
      const contentState = editorState.getCurrentContent();
      const rawContent = convertToRaw(contentState);
      const htmlContent = convertDraftToHTML(rawContent);
      
      const formattedData = {
        ...formData,
        description: htmlContent,
        skills: validSkills.map(skill => skill.id),
        compensation_amount: parseFloat(formData.compensation_amount) || 0,
        review_compensation_amount: parseFloat(formData.review_compensation_amount) || 0,
        num_reviewers: parseInt(formData.num_reviewers) || 2,
        task_duration: formData.task_duration ? parseInt(formData.task_duration) : null
      };

      const response = await saveTaskDraft(formattedData);
      setHasUnsavedChanges(false);
      setError('');
      // Show success message and close modal
      console.log('Draft saved successfully:', response.data);
      onTaskCreated(response.data);
      onClose();
    } catch (err) {
      console.error('Error saving draft:', err);
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          const errorMessages = err.response.data.detail.map(error => error.msg).join(', ');
          setError(errorMessages);
        } else {
          setError(err.response.data.detail);
        }
      } else {
        setError('Failed to save draft. Please try again.');
      }
    } finally {
      setDraftSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form submitted at step:", currentStep);
    console.log("Submit event type:", e.type);
    console.log("Submit event target:", e.target);
    console.log("Submit event currentTarget:", e.currentTarget);
    console.log("Form validation state:", e.target.checkValidity());
    
    // Only allow submission if we're on step 3 and it's a proper submit event
    if (currentStep !== 3) {
      console.log("Preventing submission - not on step 3");
      return;
    }
    
    // Check if this was triggered by the submit button
    const submitter = e.nativeEvent?.submitter;
    console.log("Submitter element:", submitter);
    console.log("Submitter type:", submitter?.type);
    console.log("Submitter disabled:", submitter?.disabled);
    
    // Only allow submission if submitter is not disabled and is a submit button
    if (!submitter || submitter.type !== 'submit' || submitter.disabled) {
      console.log("Preventing submission - invalid submitter");
      return;
    }
    
    // Additional check: ensure this was a real user click
    if (!e.isTrusted) {
      console.log("Preventing submission - not a trusted event");
      return;
    }
    
    // Check if submission is allowed
    if (!allowSubmission) {
      console.log("Preventing submission - not explicitly allowed");
      return;
    }
    
    // Reset the flag
    setAllowSubmission(false);
    
    setLoading(true);
    setError('');

    try {
      // Ensure all skills have valid database IDs
      const validSkills = formData.skills.filter(skill => {
        return typeof skill.id === 'number' && skill.id > 0;
      });

      if (validSkills.length === 0) {
        setError('Please select at least one valid skill.');
        return;
      }

      // Convert Draft.js content to HTML for submission
      const contentState = editorState.getCurrentContent();
      const rawContent = convertToRaw(contentState);
      const htmlContent = convertDraftToHTML(rawContent);
      
      const formattedData = {
        ...formData,
        description: htmlContent,
        skills: validSkills.map(skill => skill.id),
        compensation_amount: parseFloat(formData.compensation_amount) || 0,
        review_compensation_amount: parseFloat(formData.review_compensation_amount) || 0,
        num_reviewers: parseInt(formData.num_reviewers) || 2,
        task_duration: formData.task_duration ? parseInt(formData.task_duration) : null
      };

      const response = await createTask(formattedData);
      setHasUnsavedChanges(false);
      onTaskCreated(response.data);
      onClose();
    } catch (err) {
      console.error('Error creating task:', err);
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          const errorMessages = err.response.data.detail.map(error => error.msg).join(', ');
          setError(errorMessages);
        } else {
          setError(err.response.data.detail);
        }
      } else {
        setError('Failed to create task. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle number inputs
    if (name === 'compensation_amount' || name === 'review_compensation_amount' || name === 'task_duration') {
      const numValue = value === '' ? null : parseFloat(value);
      setFormData(prev => ({
        ...prev,
        [name]: numValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Mark as having unsaved changes
    setHasUnsavedChanges(true);
  };

  const handleAddSkill = (skill) => {
    if (!formData.skills.some(s => s.id === skill.id)) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, skill],
        // Initialize skill level requirement for this skill
        skill_review_requirements: {
          ...prev.skill_review_requirements,
          [skill.name]: 1.8  // Default to level 1.8 required
        }
      }));
      setHasUnsavedChanges(true);
    }
    setSkillSearch('');
    setShowSkillDropdown(false);
  };

  const handleAddNewSkill = async () => {
    if (!skillSearch.trim()) return;
    const newSkillName = skillSearch.trim();
    
    // Check if already exists in formData.skills
    if (formData.skills.some(s => s.name.toLowerCase() === newSkillName.toLowerCase())) {
      setSkillSearch('');
      setShowSkillDropdown(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Create the skill in the database first
      const response = await createSkill({ 
        name: newSkillName, 
        category: formData.category || 'Other' 
      });
      
      // Add the newly created skill to the form
      const newSkill = {
        id: response.data.id, // Use the real database ID
        name: response.data.name,
        category: response.data.category
      };
      
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill],
        // Initialize skill level requirement for this skill
        skill_review_requirements: {
          ...prev.skill_review_requirements,
          [newSkill.name]: 1.8  // Default to level 1.8 required
        }
      }));
      
      // Also add to available skills for future use
      setAvailableSkills(prev => [...prev, newSkill]);
      
      setSkillSearch('');
      setShowSkillDropdown(false);
      setHasUnsavedChanges(true);
      
      // Show success message
      console.log(`Skill "${newSkillName}" created successfully with ID: ${newSkill.id}`);
      
    } catch (err) {
      console.error('Error creating skill:', err);
      let errorMessage = 'Failed to create skill.';
      
      if (err.response?.data?.detail) {
        if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map(error => error.msg).join(', ');
        } else {
          errorMessage = err.response.data.detail;
        }
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSkill = (skillId) => {
    const skillToRemove = formData.skills.find(s => s.id === skillId);
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill.id !== skillId),
      // Remove skill level requirement for this skill
      skill_review_requirements: skillToRemove ? 
        Object.fromEntries(
          Object.entries(prev.skill_review_requirements).filter(([key]) => key !== skillToRemove.name)
        ) : prev.skill_review_requirements
    }));
    setHasUnsavedChanges(true);
  };

  const updateSkillLevelRequirement = (skillName, value) => {
    setFormData(prev => ({
      ...prev,
      skill_review_requirements: {
        ...prev.skill_review_requirements,
        [skillName]: Math.max(0, Math.min(5, parseFloat(value) || 0))  // Between 0-5
      }
    }));
    setHasUnsavedChanges(true);
  };

  const renderSkillLevelStars = (level) => {
    const numLevel = parseFloat(level);
    return (
      <span className="text-sm font-medium text-gray-700">
        {numLevel.toFixed(1)}
      </span>
    );
  };

  const filteredSkills = availableSkills.filter(skill =>
    skill.name.toLowerCase().includes(skillSearch.toLowerCase())
  );

  const CATEGORY_OPTIONS = [
    { value: '', label: 'Select category' },
    { value: 'development', label: 'Development' },
    { value: 'design', label: 'Design' },
    { value: 'research', label: 'Research' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'review', label: 'Review' },
    { value: 'other', label: 'Other' }
  ];

  // Validation functions
  const isStep1Valid = () => {
    // Check if all skills have valid database IDs
    const allSkillsValid = formData.skills.every(skill => 
      typeof skill.id === 'number' && skill.id > 0
    );
    
    return formData.category && 
           formData.title.trim() !== '' && 
           formData.skills.length > 0 && 
           allSkillsValid;
  };

  const isStep2Valid = () => {
    return editorState.getCurrentContent().getPlainText().trim() !== '';
  };
  const isStep3Valid = () => {
    const isValid = (
      parseFloat(formData.compensation_amount) >= 0 &&
      parseFloat(formData.review_compensation_amount) >= 0 &&
      formData.num_reviewers !== '' &&
      !isNaN(formData.num_reviewers) &&
      parseInt(formData.num_reviewers) >= 1 &&
      parseInt(formData.num_reviewers) <= 5 &&
      formData.task_duration !== '' &&
      !isNaN(formData.task_duration) &&
      parseInt(formData.task_duration) >= 0
    );
    console.log("Step 3 validation check:", isValid, {
      compensation_amount: formData.compensation_amount,
      review_compensation_amount: formData.review_compensation_amount,
      num_reviewers: formData.num_reviewers,
      task_duration: formData.task_duration
    });
    return isValid;
  };

  const nextStep = () => {
    console.log("nextStep called at step:", currentStep);
    if (currentStep === 1 && !isStep1Valid()) {
      console.log("Step 1 validation failed");
      return;
    }
    if (currentStep === 2 && !isStep2Valid()) {
      console.log("Step 2 validation failed");
      return;
    }
    if (currentStep === 3 && !isStep3Valid()) {
      console.log("Step 3 validation failed");
      return;
    }
    console.log("Moving to next step from:", currentStep);
    setCurrentStep(prev => Math.min(prev + 1, 3));
  };
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const generateTemplate = async () => {
    setIsGeneratingTemplate(true);
    setError('');
    try {
      // Replace this with your backend call if available
      // Example: const response = await fetchAiTemplate({ title: formData.title, category: formData.category, skills: formData.skills });
      // setDescriptionTemplate(response.data.template);
      // setDescriptionTemplate(response.data.template);
      // setFormData(prev => ({ ...prev, description: response.data.template }));
      await new Promise(res => setTimeout(res, 1200)); // Simulate delay
      const template = `# ${formData.title}\n\nCategory: ${formData.category}\n\n## Background\n(Describe the project background and goals here.)\n\n## Brief Description\n(Fill in the details here.)\n\n## Objectives\n(Fill in the details here.)\n\n## Step-by-Step Instructions\n(Fill in the details here.)\n\n## Technical Requirements\n(Fill in the details here.)\n\n## Evaluation Criteria\n(Fill in the details here.)`;
      setDescriptionTemplate(template);
      
      // Convert template to Draft.js content
      const contentState = convertFromRaw({
        blocks: [
          {
            text: template,
            type: 'unstyled',
            depth: 0,
            inlineStyleRanges: [],
            entityRanges: [],
            key: 'template'
          }
        ],
        entityMap: {}
      });
      const newEditorState = EditorState.createWithContent(contentState);
      setEditorState(newEditorState);
    } catch (err) {
      setError('Failed to generate template.');
    } finally {
      setIsGeneratingTemplate(false);
    }
  };

  // Draft.js rich text editor functions
  const handleEditorChange = (newEditorState) => {
    setEditorState(newEditorState);
    
    // Only convert to HTML when we need to submit the form
    // Keep the Draft.js state intact for editing
    setHasUnsavedChanges(true);
  };



  // Helper function to convert Draft.js content to HTML
  const convertDraftToHTML = (rawContent) => {
    // Since we're not using formatting, just return plain text
    return rawContent.blocks.map(block => block.text).join('\n');
  };

  // Add custom styles to document head
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = customStyles;
    document.head.appendChild(styleElement);
    
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Sync form data with editor state when editor changes
  useEffect(() => {
    const contentState = editorState.getCurrentContent();
    const plainText = contentState.getPlainText();
    
    // Only update if the content actually changed
    if (formData.description !== plainText) {
      setFormData(prev => ({ ...prev, description: plainText }));
    }
  }, [editorState]);

  if (!isOpen) return null;

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-700">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          name="category"
          required
          value={formData.category}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base py-2"
        >
          {CATEGORY_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Task Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          required
          value={formData.title}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg py-3 px-4"
          placeholder="Enter a short, clear task title (e.g. 'Build landing page')"
        />
      </div>
      <div>
        <label className="block text-lg font-medium text-gray-700 mb-2">
          Required Skills & Minimum Levels <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-600 mb-3">
          Select skills and set the minimum skill level required (0.0-5.0) for contributors to undertake this task. Use 0.0 for no requirement.
        </p>
        <div className="relative">
          <input
            ref={skillInputRef}
            type="text"
            value={skillSearch}
            onChange={(e) => setSkillSearch(e.target.value)}
            onFocus={() => setShowSkillDropdown(true)}
            className="block w-full rounded-lg border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-lg py-3 px-4 mb-2"
            placeholder="Search for skills..."
          />
          {showSkillDropdown && (
            <div ref={skillDropdownRef} className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-72 overflow-auto">
              {filteredSkills.length > 0 ? (
                filteredSkills.map(skill => (
                  <div
                    key={skill.id}
                    onClick={() => handleAddSkill(skill)}
                    className="px-4 py-3 hover:bg-indigo-50 cursor-pointer text-base"
                  >
                    {skill.name}
                  </div>
                ))
              ) : (
                <div className="py-3 px-4 text-gray-500 text-base">
                  No matching skills found
                </div>
              )}
              {skillSearch && !filteredSkills.some(skill => skill.name.toLowerCase() === skillSearch.toLowerCase()) && (
                <div
                  className="cursor-pointer select-none relative py-3 px-4 hover:bg-green-50 border-t border-gray-200 text-green-600 font-medium text-base"
                  onClick={handleAddNewSkill}
                >
                  + Add "{skillSearch}" as new skill
                </div>
              )}
            </div>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          {formData.skills.map(skill => (
            <div key={skill.id} className="flex items-center gap-3 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full shadow border border-blue-200">
              <span className="text-lg font-medium text-blue-900 mr-2">{skill.name}</span>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600">Min Level:</label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  value={formData.skill_review_requirements[skill.name] ?? ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') {
                      updateSkillLevelRequirement(skill.name, 1.8);
                    } else {
                      updateSkillLevelRequirement(skill.name, parseFloat(value) || 0);
                    }
                  }}
                  className="px-2 py-1 text-xs border border-gray-300 rounded focus:border-blue-500 focus:ring-blue-500 w-16 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="0.0"
                />
              </div>

              <button
                type="button"
                onClick={() => handleRemoveSkill(skill.id)}
                className="ml-2 text-red-500 hover:text-red-700"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold">Detailed Description</h3>
      </div>
      
      <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
        <label htmlFor="description" className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-3">
          <Target className="w-4 h-4 text-blue-600" />
          Task Description <span className="text-red-500">*</span>
        </label>
        
        
        <div className="border-2 border-gray-200 rounded-lg focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100 focus-within:ring-opacity-50 min-h-[200px] bg-white">
          <Editor
            ref={editorRef}
            editorState={editorState}
            onChange={handleEditorChange}
            placeholder="Write your task description here...

• What needs to be accomplished?
• What are the key deliverables?
• What skills or experience are required?
• Any specific requirements or constraints?

Feel free to be detailed and structured in your description."
            editorClassName="px-5 py-4 text-base font-sans leading-relaxed text-gray-800 min-h-[200px] outline-none"
            onMouseDown={() => {
              // Ensure the editor gets focus when clicked
              if (editorRef.current) {
                editorRef.current.focus();
              }
            }}
          />
        </div>
        <div className="mt-2 flex justify-between items-center text-xs text-gray-500">
          <span>Press Enter for line breaks</span>
          <span>{editorState.getCurrentContent().getPlainText().length} characters</span>
        </div>
        {/* AI Template Button - Commented out for now
        <button
          type="button"
          className="mt-4 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 font-medium shadow-sm transition-all duration-200 hover:shadow-md"
          onClick={generateTemplate}
          disabled={isGeneratingTemplate || !formData.title || !formData.category}
        >
          {isGeneratingTemplate ? 'Generating Template...' : 'Generate AI Template'}
        </button>
        */}
      </div>
      {/* AI Template Display - Commented out for now
      {descriptionTemplate && !isGeneratingTemplate && (
        <div className="mt-2 text-sm text-gray-600">
          <span>💡 AI template generated based on your task details. Feel free to edit and customize it.</span>
          <div className="border rounded p-3 mt-2 bg-gray-50">
            <div className="whitespace-pre-wrap">
              <ReactMarkdown>{descriptionTemplate}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
      */}
    </div>
  );

  const renderStep3 = () => {
    console.log("Rendering step 3");
    return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <DollarSign className="w-5 h-5 text-green-500" />
        <h3 className="text-lg font-semibold">Compensation & Reviewers</h3>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="compensation_type" className="block text-sm font-medium text-gray-700">
            Task Compensation Type
          </label>
          <select
            id="compensation_type"
            name="compensation_type"
            required
            value={formData.compensation_type}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="cash">Cash</option>
            <option value="equity">Equity</option>
          </select>
        </div>
        <div>
          <label htmlFor="compensation_amount" className="block text-sm font-medium text-gray-700">
            Task Compensation Amount
          </label>
          <input
            type="number"
            id="compensation_amount"
            name="compensation_amount"
            required
            min="0"
            value={formData.compensation_amount}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="Enter amount"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="review_compensation_type" className="block text-sm font-medium text-gray-700">
            Review Compensation Type
          </label>
          <select
            id="review_compensation_type"
            name="review_compensation_type"
            required
            value={formData.review_compensation_type}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="cash">Cash</option>
            <option value="equity">Equity</option>
          </select>
        </div>
        <div>
          <label htmlFor="review_compensation_amount" className="block text-sm font-medium text-gray-700">
            Review Compensation Amount
          </label>
          <input
            type="number"
            id="review_compensation_amount"
            name="review_compensation_amount"
            required
            min="0"
            value={formData.review_compensation_amount}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="Enter amount"
          />
        </div>
      </div>
      <div>
        <label htmlFor="num_reviewers" className="block text-lg font-medium text-gray-700">
          Number of Reviewers <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="num_reviewers"
          name="num_reviewers"
          required
          min="1"
          max="5"
          value={formData.num_reviewers}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
      
      {/* Task Duration */}
      <div className="border-t pt-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4">Task Duration</h4>
        
        <div>
          <label htmlFor="task_duration" className="block text-sm font-medium text-gray-700">
            Task Duration (hours) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="task_duration"
            name="task_duration"
            required
            min="1"
            value={formData.task_duration}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="e.g., 8"
          />
          <p className="mt-2 text-sm text-gray-600">
            Maximum time allowed to complete this task. Late completion will result in penalties.
          </p>
        </div>
      </div>
    </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      default: return renderStep1();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      ></div>
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl p-10 z-10 max-h-[95vh] overflow-y-auto text-[1.15rem]">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Create New Task</h2>
            <p className="text-gray-600">Step {currentStep} of 3</p>
          </div>
          <button 
            type="button"
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          onKeyDown={e => {
            // Allow Enter key in textarea elements for line breaks
            if (e.target.tagName === 'TEXTAREA') {
              return; // Allow Enter key to work normally in textareas
            }
            
            // Prevent Enter from submitting the form unless on step 3 and focused on the submit button
            if (e.key === 'Enter' && currentStep < 3) {
              e.preventDefault();
              return false;
            }
            // Also prevent Enter from submitting on step 3 unless explicitly clicking the submit button
            if (e.key === 'Enter' && currentStep === 3 && e.target.type !== 'submit') {
              e.preventDefault();
              return false;
            }
          }}
          className="space-y-6"
        >
          {renderStepContent()}
          
          <div className="flex justify-between pt-6 border-t">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-2 px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>
              
              {/* Save Draft Button */}
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={draftSaving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {draftSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save Draft
                  </>
                )}
              </button>
            </div>
            
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={
                  (currentStep === 1 && !isStep1Valid()) ||
                  (currentStep === 2 && !isStep2Valid())
                }
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
              >
                {((currentStep === 1 && !isStep1Valid()) || (currentStep === 2 && !isStep2Valid())) ? 'Fill Required Fields' : 'Next'}
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !isStep3Valid()}
                onClick={() => {
                  console.log("Submit button clicked manually");
                  setAllowSubmission(true);
                }}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50"
              >
                {loading ? 'Creating Task...' : 'Create Task'}
                <CheckCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </form>
        
        {/* Close Confirmation Dialog */}
        {showCloseConfirmation && (
          <div className="fixed inset-0 flex items-center justify-center z-[9999] bg-black bg-opacity-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">
                Save Draft?
              </h3>
              <p className="text-gray-600 mb-6 text-sm">
                You have unsaved changes. Save as draft?
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleCancelClose}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={draftSaving}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
                >
                  {draftSaving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmClose}
                  className="px-4 py-2 text-red-600 hover:text-red-800 text-sm"
                >
                  Don't Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DispatchTaskModal; 