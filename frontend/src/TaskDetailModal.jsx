import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle, XCircle, User, FileText, MessageSquare, Calendar, DollarSign, AlertCircle, Share2, Edit3, Save, CheckCircle as CheckCircleIcon } from 'lucide-react';
import { fetchTaskDetails, fetchReviewTaskDetails, canUndertakeTask, fetchUserSkills, updateTask, finishEditingTask, fetchSkills, createSkill } from './api';
import TaskDurationInfo from './components/TaskDurationInfo';
import ReactMarkdown from 'react-markdown';

const TaskDetailModal = ({ isOpen, task = {
  title: 'Untitled Task',
  description: 'No description provided',
  skills: [],
  compensation_type: 'cash',
  compensation_amount: 0,
  review_compensation_type: 'cash',
  review_compensation_amount: 0,
  status: 'open',
  creator_name: 'Unknown Creator',
  has_assignment: false,
  type: 'task',
  id: null
}, onClose, onUndertake, isReviewTask, onResubmit, onSubmit }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [taskDetails, setTaskDetails] = useState(null);
  const [error, setError] = useState(null);
  const [canUndertake, setCanUndertake] = useState(null);
  const [capabilityLoading, setCapabilityLoading] = useState(false);
  const [userSkills, setUserSkills] = useState([]);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTask, setEditedTask] = useState(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [editSuccess, setEditSuccess] = useState('');
  
  // Skills management state
  const [availableSkills, setAvailableSkills] = useState([]);
  const [skillSearch, setSkillSearch] = useState('');
  const [showSkillDropdown, setShowSkillDropdown] = useState(false);

  useEffect(() => {
    if (isOpen && task?.id) {
      
      
      // For review tasks, default to submissions tab since that's what reviewers need to see
      if (task.type === 'review') {
        console.log('Setting active tab to submissions for review task');
        setActiveTab('submissions');
      } else {
        setActiveTab('overview');
      }
      
      // Load detailed task information
      fetchAndSetTaskDetails();
      
      // Only check capability if this is not an already undertaken task
      // Check if the task has assignment information indicating it's already undertaken
      const isAlreadyUndertaken = task.has_assignment || task.assignment_id || task.status === 'in_progress' || task.status === 'submitted';
      console.log('DEBUG: Is task already undertaken?', isAlreadyUndertaken);
      
      if (!isAlreadyUndertaken) {
        checkTaskCapability();
      } else {
        console.log('DEBUG: Skipping capability check for already undertaken task');
        setCanUndertake(null); // Clear any previous capability data
      }
      
      // Fetch user skills
      const userData = JSON.parse(localStorage.getItem('userData'));
      if (userData && userData.id) {
        fetchUserSkills(userData.id).then(res => {
          setUserSkills(res.data || []);
        });
      }
      
      console.log('=== END TASK DETAIL MODAL DEBUG ===');
    }
  }, [isOpen, task?.id]);

  // Load available skills when modal opens
  useEffect(() => {
    const loadSkills = async () => {
      try {
        const response = await fetchSkills();
        setAvailableSkills(response.data);
      } catch (err) {
        console.error('Error loading skills:', err);
      }
    };
    
    if (isOpen) {
      loadSkills();
    }
  }, [isOpen]);

  // Handle clicking outside the skills dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.skills-dropdown-container')) {
        setShowSkillDropdown(false);
      }
    };

    if (showSkillDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSkillDropdown]);

  const fetchAndSetTaskDetails = async () => {
    if (!task?.id) return;
    
    try {
      let response;
      if (task.type === 'review') {
        response = await fetchReviewTaskDetails(task.id);
      } else {
        response = await fetchTaskDetails(task.id);
      }
      
      const taskData = response.data || response;
      
      // Add current user ID to task details for duration component
      const userData = JSON.parse(localStorage.getItem('userData'));
      if (userData && userData.id) {
        taskData.current_user_id = userData.id;
      }
      
      setTaskDetails(taskData);
      
      // Auto-enter edit mode if task is already being edited
      if (taskData.status === 'editing' && taskData.user_id === userData?.id) {
        setEditedTask({
          title: taskData.title || '',
          description: taskData.description || '',
          category: taskData.category || 'Other',
          deadline: taskData.deadline ? new Date(taskData.deadline).toISOString().split('T')[0] : '',
          compensation_type: taskData.compensation?.task?.compensation_type || 'cash',
          compensation_amount: taskData.compensation?.task?.amount || '',
          review_compensation_type: taskData.compensation?.review?.compensation_type || 'cash',
          review_compensation_amount: taskData.compensation?.review?.amount || '',
          task_duration: taskData.task_duration || '',
          num_reviewers: taskData.num_reviewers || 2,
          max_parallel_contributors: taskData.max_parallel_contributors || null,
          skills: taskData.skills || []
        });
        setIsEditing(true);
      }
    } catch (err) {
      console.error('Error loading task details:', err);
      setError('Failed to load task details');
    }
  };

  const checkTaskCapability = async () => {
    if (!task?.id) return;
    
    setCapabilityLoading(true);
    try {
      // Use 'review' assignment type for review tasks, 'task' for regular tasks
      const assignmentType = task.type === 'review' ? 'review' : 'task';
      
      const response = await canUndertakeTask(task.id, assignmentType);
      setCanUndertake(response.data);
    } catch (err) {
      console.error('Error checking task capability:', err);
      setCanUndertake({
        can_undertake: false,
        reason: 'Unable to check capabilities'
      });
    } finally {
      setCapabilityLoading(false);
    }
  };

  const handleShare = async () => {
    const taskUrl = `${window.location.origin}/tasks/${task.id}`;
    try {
      await navigator.clipboard.writeText(taskUrl);
      setShareSuccess(true);
      setTimeout(() => setShareSuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  const handleEditTask = () => {
    if (!taskDetails) return;
    
    // Initialize edited task with current values
    setEditedTask({
      title: taskDetails.title || '',
      description: taskDetails.description || '',
      category: taskDetails.category || 'Other',
      deadline: taskDetails.deadline ? new Date(taskDetails.deadline).toISOString().split('T')[0] : '',
      compensation_type: taskDetails.compensation?.task?.compensation_type || 'cash',
      compensation_amount: taskDetails.compensation?.task?.amount || '',
      review_compensation_type: taskDetails.compensation?.review?.compensation_type || 'cash',
      review_compensation_amount: taskDetails.compensation?.review?.amount || '',
      task_duration: taskDetails.task_duration || '',
      num_reviewers: taskDetails.num_reviewers || 2,
      max_parallel_contributors: taskDetails.max_parallel_contributors || null,
      skills: taskDetails.skills || []
    });
    setIsEditing(true);
    setEditError('');
    setEditSuccess('');
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedTask(null);
    setEditError('');
    setEditSuccess('');
  };

  const handleSaveTask = async () => {
    if (!editedTask || !taskDetails) return;
    
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');

    try {
      // Prepare task data for update
      const taskData = {
        title: editedTask.title,
        description: editedTask.description,
        category: editedTask.category,
        deadline: editedTask.deadline ? new Date(editedTask.deadline).toISOString() : null,
        compensation_type: editedTask.compensation_type,
        compensation_amount: parseFloat(editedTask.compensation_amount) || 0,
        review_compensation_type: editedTask.review_compensation_type,
        review_compensation_amount: parseFloat(editedTask.review_compensation_amount) || 0,
        task_duration: editedTask.task_duration ? parseInt(editedTask.task_duration) : null,
        num_reviewers: editedTask.num_reviewers ? parseInt(editedTask.num_reviewers) : 2,
        max_parallel_contributors: editedTask.max_parallel_contributors ? parseInt(editedTask.max_parallel_contributors) : null,
        skills: editedTask.skills.map(skill => skill.id)
      };

      await updateTask(taskDetails.id, taskData);
      setEditSuccess('Draft saved successfully! Task is now in editing mode and cannot be undertaken.');
      
      // Refresh task details
      await fetchAndSetTaskDetails();
      
      // Keep edit mode active since task is now in editing status
      setIsEditing(true);
    } catch (err) {
      console.error('Error updating task:', err);
      setEditError(err.response?.data?.detail || 'Failed to update task');
    } finally {
      setEditLoading(false);
    }
  };

  const handleSaveAsDraft = async () => {
    if (!editedTask || !taskDetails) return;
    
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');

    try {
      // Prepare task data for saving as draft
      const taskData = {
        title: editedTask.title,
        description: editedTask.description,
        category: editedTask.category,
        deadline: editedTask.deadline ? new Date(editedTask.deadline).toISOString() : null,
        compensation_type: editedTask.compensation_type,
        compensation_amount: parseFloat(editedTask.compensation_amount) || 0,
        review_compensation_type: editedTask.review_compensation_type,
        review_compensation_amount: parseFloat(editedTask.review_compensation_amount) || 0,
        task_duration: editedTask.task_duration ? parseInt(editedTask.task_duration) : null,
        num_reviewers: editedTask.num_reviewers ? parseInt(editedTask.num_reviewers) : 2,
        max_parallel_contributors: editedTask.max_parallel_contributors ? parseInt(editedTask.max_parallel_contributors) : null,
        skills: editedTask.skills.map(skill => skill.id)
      };

      // Save as draft (this will change status to 'editing' for draft/open tasks)
      await updateTask(taskDetails.id, taskData);
      
      // Determine appropriate success message based on original status
      const originalStatus = taskDetails.status;
      if (originalStatus === 'draft') {
        setEditSuccess('Draft saved successfully! Task is now in editing mode.');
      } else if (originalStatus === 'open') {
        setEditSuccess('Changes saved successfully! Task is now in editing mode and cannot be undertaken.');
      } else {
        setEditSuccess('Changes saved successfully!');
      }
      
      // Refresh task details
      await fetchAndSetTaskDetails();
      
      // Keep edit mode active
      setIsEditing(true);
    } catch (err) {
      console.error('Error saving draft:', err);
      setEditError(err.response?.data?.detail || 'Failed to save draft');
    } finally {
      setEditLoading(false);
    }
  };

  const handleFinishEditing = async () => {
    if (!taskDetails) return;
    
    setEditLoading(true);
    setEditError('');
    setEditSuccess('');

    try {
      // Prepare task data for finish editing (same as save draft)
      const taskData = {
        title: editedTask.title,
        description: editedTask.description,
        category: editedTask.category,
        deadline: editedTask.deadline ? new Date(editedTask.deadline).toISOString() : null,
        compensation_type: editedTask.compensation_type,
        compensation_amount: parseFloat(editedTask.compensation_amount) || 0,
        review_compensation_type: editedTask.review_compensation_type,
        review_compensation_amount: parseFloat(editedTask.review_compensation_amount) || 0,
        task_duration: editedTask.task_duration ? parseInt(editedTask.task_duration) : null,
        num_reviewers: editedTask.num_reviewers ? parseInt(editedTask.num_reviewers) : 2,
        max_parallel_contributors: editedTask.max_parallel_contributors ? parseInt(editedTask.max_parallel_contributors) : null,
        skills: editedTask.skills.map(skill => skill.id)
      };

      await finishEditingTask(taskDetails.id, taskData);
      
      // Determine appropriate success message based on original status
      const originalStatus = taskDetails.status;
      if (originalStatus === 'draft') {
        setEditSuccess('Draft published successfully! Task is now available for contributors.');
      } else {
        setEditSuccess('Task editing finished! Task is now available for contributors.');
      }
      
      // Refresh task details
      await fetchAndSetTaskDetails();
      
      // Exit edit mode
      setIsEditing(false);
      setEditedTask(null);
    } catch (err) {
      console.error('Error finishing editing:', err);
      setEditError(err.response?.data?.detail || 'Failed to finish editing task');
    } finally {
      setEditLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Skills management functions
  const handleAddSkill = (skill) => {
    if (!editedTask.skills.some(s => s.id === skill.id)) {
      setEditedTask(prev => ({
        ...prev,
        skills: [...prev.skills, skill]
      }));
    }
    setSkillSearch('');
    setShowSkillDropdown(false);
  };

  const handleRemoveSkill = (skillId) => {
    setEditedTask(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill.id !== skillId)
    }));
  };

  const handleAddNewSkill = async () => {
    if (!skillSearch.trim()) return;
    const newSkillName = skillSearch.trim();
    
    // Check if already exists in editedTask.skills
    if (editedTask.skills.some(s => s.name.toLowerCase() === newSkillName.toLowerCase())) {
      setSkillSearch('');
      setShowSkillDropdown(false);
      return;
    }
    
    try {
      // Create the skill in the database first
      const response = await createSkill({ 
        name: newSkillName, 
        category: editedTask.category || 'Other' 
      });
      
      // Add the newly created skill to the form
      const newSkill = {
        id: response.data.id,
        name: response.data.name,
        category: response.data.category
      };
      
      setEditedTask(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill]
      }));
      
      // Also add to available skills for future use
      setAvailableSkills(prev => [...prev, newSkill]);
      
      setSkillSearch('');
      setShowSkillDropdown(false);
      
    } catch (err) {
      console.error('Error creating skill:', err);
      setEditError('Failed to create new skill');
    }
  };


  if (!isOpen || !task) {
    return null;
  }

  const formatCompensation = (comp) => {
    if (!comp || !comp.compensation_type || !comp.amount) return 'No compensation specified';
    if (comp.compensation_type === 'cash') {
      return `$${comp.amount}`;
    } else if (comp.compensation_type === 'equity') {
      return `${comp.amount}% equity`;
    }
    return `${comp.amount} ${comp.compensation_type}`;
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 text-sm rounded-full font-medium";
    switch (status) {
      case 'open':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'in_progress':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'submitted':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'completed':
        return `${baseClasses} bg-purple-100 text-purple-800`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'resubmitted':
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case 'needs_review':
        return `${baseClasses} bg-pink-100 text-pink-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getStatusDescription = (status) => {
    switch (status) {
      case 'open':
        return 'This task is available for contributors to undertake.';
      case 'in_progress':
        return 'One or more contributors are currently working on this task.';
      case 'submitted':
        return 'Work has been submitted and is awaiting review from reviewers.';
      case 'completed':
        return 'This task has been successfully completed and approved.';
      case 'rejected':
        return 'The submitted work was rejected by majority of reviewers. Task is now open for other contributors. Task will be available for you after a grace period based on task status.';
      case 'resubmitted':
        return 'Work has been resubmitted and is awaiting review.';
      case 'needs_review':
        return 'The work is borderline and needs additional review.';
      default:
        return 'Status information not available.';
    }
  };

  const renderCapabilityIndicator = () => {
    // Check if this is an already undertaken task
    const isAlreadyUndertaken = task.has_assignment || task.assignment_id || task.status === 'in_progress' || task.status === 'submitted';
    
    // Don't show capability indicator for already undertaken tasks
    if (isAlreadyUndertaken) {
      return null;
    }
    
    if (capabilityLoading) {
      return (
        <div className="flex items-center gap-2 text-gray-500">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500"></div>
          <span className="text-sm">Checking availability...</span>
        </div>
      );
    }

    if (!canUndertake) return null;

    if (canUndertake.can_undertake) {
      const actionText = task.type === 'review' ? 'review' : 'undertake';
      return (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-5 w-5" />
          <span className="text-sm font-medium">You can {actionText} this task</span>
        </div>
      );
    } else {
      // Check if user is blocked due to previous rejection
      if (canUndertake.block_details) {
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              <span className="text-sm font-medium">You are blocked from this task</span>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700 mb-1">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">Block Details</span>
              </div>
              <p className="text-xs text-red-600 mb-2">{canUndertake.block_details.reason}</p>
              <div className="flex items-center justify-between text-xs text-red-600">
                <span>Days remaining: {canUndertake.block_details.days_remaining}</span>
                <span>Blocked until: {new Date(canUndertake.block_details.blocked_until).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        );
      }
      
      return (
        <div className="flex items-center gap-2 text-red-600">
          <XCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{canUndertake.reason}</span>
        </div>
      );
    }
  };

  const renderOverviewTab = () => {
    if (isEditing && editedTask) {
      return (
        <div className="space-y-6">
          {/* Edit Form */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Edit Task Information</h4>
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Title *</label>
                <input
                  type="text"
                  name="title"
                  value={editedTask.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter task title"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Category</label>
                <select
                  name="category"
                  value={editedTask.category}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="Other">Other</option>
                  <option value="Development">Development</option>
                  <option value="Design">Design</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Research">Research</option>
                  <option value="Writing">Writing</option>
                  <option value="Translation">Translation</option>
                  <option value="Data Analysis">Data Analysis</option>
                  <option value="Testing">Testing</option>
                  <option value="Documentation">Documentation</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Description *</label>
                <textarea
                  name="description"
                  value={editedTask.description}
                  onChange={handleInputChange}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe the task requirements"
                />
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  value={editedTask.deadline}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Task Duration */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Task Duration (hours)</label>
                <input
                  type="number"
                  name="task_duration"
                  value={editedTask.task_duration}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Estimated hours to complete"
                />
              </div>

              {/* Number of Reviewers */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Number of Reviewers</label>
                <input
                  type="number"
                  name="num_reviewers"
                  value={editedTask.num_reviewers}
                  onChange={handleInputChange}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Number of reviewers needed"
                />
              </div>

              {/* Max Parallel Contributors */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Max Parallel Contributors</label>
                <input
                  type="number"
                  name="max_parallel_contributors"
                  value={editedTask.max_parallel_contributors}
                  onChange={handleInputChange}
                  min="1"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Maximum contributors working simultaneously"
                />
              </div>

              {/* Compensation */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Task Compensation Type</label>
                  <select
                    name="compensation_type"
                    value={editedTask.compensation_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="cash">Cash</option>
                    <option value="equity">Equity</option>
                    <option value="experience">Experience</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Task Compensation Amount</label>
                  <input
                    type="number"
                    name="compensation_amount"
                    value={editedTask.compensation_amount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Amount"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Review Compensation Type</label>
                  <select
                    name="review_compensation_type"
                    value={editedTask.review_compensation_type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="cash">Cash</option>
                    <option value="equity">Equity</option>
                    <option value="experience">Experience</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Review Compensation Amount</label>
                  <input
                    type="number"
                    name="review_compensation_amount"
                    value={editedTask.review_compensation_amount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Amount"
                  />
                </div>
              </div>

              {/* Skills Section */}
              <div>
                <label className="block text-xs text-gray-500 mb-2">Required Skills</label>
                <div className="space-y-3">
                  {/* Skill Search and Add */}
                  <div className="relative skills-dropdown-container">
                    <input
                      type="text"
                      value={skillSearch}
                      onChange={(e) => setSkillSearch(e.target.value)}
                      onFocus={() => setShowSkillDropdown(true)}
                      placeholder="Search or add skills..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    
                    {/* Skill Dropdown */}
                    {showSkillDropdown && (skillSearch || availableSkills.length > 0) && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                        {/* Filtered skills */}
                        {availableSkills
                          .filter(skill => 
                            skill.name.toLowerCase().includes(skillSearch.toLowerCase()) &&
                            !editedTask.skills.some(s => s.id === skill.id)
                          )
                          .map(skill => (
                            <div
                              key={skill.id}
                              onClick={() => handleAddSkill(skill)}
                              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            >
                              {skill.name}
                            </div>
                          ))
                        }
                        
                        {/* Add new skill option */}
                        {skillSearch && !availableSkills.some(skill => 
                          skill.name.toLowerCase() === skillSearch.toLowerCase()
                        ) && (
                          <div
                            onClick={handleAddNewSkill}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm text-blue-600 font-medium"
                          >
                            + Add "{skillSearch}" as new skill
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Selected Skills */}
                  <div className="flex flex-wrap gap-2">
                    {editedTask.skills.map(skill => (
                      <div key={skill.id} className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        <span>{skill.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill.id)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // View mode - original content
    return (
      <div className="space-y-6">
        {/* Capability Indicator */}
        {renderCapabilityIndicator()}

        {/* Basic Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Basic Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Title</p>
              <p className="text-sm font-medium text-gray-900">{task.title}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <div className="flex items-center mt-1">
                <span className={getStatusBadge(task.status)}>
                  {task.status.replace(/_/g, ' ')}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500">Created By</p>
              <p className="text-sm font-medium text-gray-900">{task.creator_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Created Date</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(task.created_at)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Deadline</p>
              <p className="text-sm font-medium text-gray-900">{formatDate(task.deadline)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Category</p>
              <p className="text-sm font-medium text-gray-900 capitalize">{task.category}</p>
            </div>
          </div>
        </div>

        {/* Task Configuration */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-blue-700 mb-3">Task Configuration</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-blue-600">Number of Reviewers</p>
              <p className="text-sm font-medium text-blue-900">
                {taskDetails?.num_reviewers || task.num_reviewers || 'Not specified'}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-600">Max Parallel Contributors</p>
              <p className="text-sm font-medium text-blue-900">
                {taskDetails?.max_parallel_contributors || task.max_parallel_contributors || 'Unlimited'}
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-600">Time Limit (Hours)</p>
              <p className="text-sm font-medium text-blue-900">
                {taskDetails?.task_duration || task.task_duration || 'No limit'}
              </p>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
          <div className="text-sm text-gray-900 whitespace-pre-wrap">
            <ReactMarkdown>{task.description}</ReactMarkdown>
          </div>
        </div>

        {/* Review Status - Show for contributors and task creators only for submitted tasks */}
        {taskDetails?.review_status && (task.status === 'submitted' || task.status === 'under_review' || task.status === 'completed') && (
          <div className="bg-purple-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-purple-700 mb-3">Review Status</h4>
            {taskDetails.review_status.all_submissions ? (
              // Task creator view - show all submissions
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-600">Total Submissions:</span>
                  <span className="text-sm font-medium text-purple-900">{taskDetails.review_status.total_submissions}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-600">With Review Tasks:</span>
                  <span className="text-sm font-medium text-purple-900">{taskDetails.review_status.submissions_with_reviews}</span>
                </div>
                <div className="space-y-2">
                  <p className="text-xs text-purple-600 font-medium">Individual Submissions:</p>
                  {taskDetails.review_status.all_submissions.map((submission, index) => (
                    <div key={submission.assignment_id} className="bg-white p-3 rounded border border-purple-200">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-purple-900">{submission.contributor_name}</span>
                        <span className={`text-xs px-2 py-1 rounded ${submission.review_tasks_created ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {submission.review_tasks_created ? 'Review Tasks Created' : 'Pending Review Tasks'}
                        </span>
                      </div>
                      <div className="text-xs text-purple-600">
                        {submission.review_progress} • {submission.review_tasks_count} review tasks
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Contributor view - show individual status
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-600">Review Tasks Created:</span>
                  <span className={`text-sm font-medium ${taskDetails.review_status.review_tasks_created ? 'text-green-600' : 'text-yellow-600'}`}>
                    {taskDetails.review_status.review_tasks_created ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-600">Reviews Received:</span>
                  <span className="text-sm font-medium text-purple-900">
                    {taskDetails.review_status.review_submissions_received} / {taskDetails.review_status.expected_reviewers}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Compensation */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-green-700 mb-3">Compensation Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-3 rounded border border-green-200">
              <h5 className="text-sm font-medium text-green-800 mb-2">Task Compensation</h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-green-600">Type:</span>
                  <span className="text-sm font-medium text-green-900 capitalize">
                    {taskDetails?.compensation?.task?.compensation_type || task.compensation?.task?.compensation_type || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-green-600">Amount:</span>
                  <span className="text-sm font-medium text-green-900">
                    {formatCompensation(taskDetails?.compensation?.task || task.compensation?.task)}
                  </span>
                </div>
              </div>
            </div>
            <div className="bg-white p-3 rounded border border-green-200">
              <h5 className="text-sm font-medium text-green-800 mb-2">Review Compensation</h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-xs text-green-600">Type:</span>
                  <span className="text-sm font-medium text-green-900 capitalize">
                    {taskDetails?.compensation?.review?.compensation_type || task.compensation?.review?.compensation_type || 'Not specified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-green-600">Amount:</span>
                  <span className="text-sm font-medium text-green-900">
                    {formatCompensation(taskDetails?.compensation?.review || task.compensation?.review)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Skills with required rating and user match indicator */}
        {(taskDetails?.skills?.length || task.skills?.length) > 0 && (
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-green-700 mb-3">Required Skills</h4>
            <div className="flex flex-wrap gap-2">
              {(taskDetails?.skills || task.skills).map((skill) => {
                const minLevel = (taskDetails?.skill_review_requirements || task.skill_review_requirements || {})[skill.name] ?? 0.0;
                // Use case-insensitive matching for user skills
                const userSkill = userSkills.find(s => s.name.toLowerCase() === skill.name.toLowerCase());
                const userSkillRating = userSkill ? userSkill.rating : null;
                const meetsRequirement = userSkillRating !== null && userSkillRating >= minLevel;
                // Debug logging
                console.log('userSkills:', userSkills);
                console.log('taskDetails.skills:', taskDetails?.skills || task.skills);
                console.log('skill:', skill.name, 'userSkillRating:', userSkillRating, 'minLevel:', minLevel, 'meetsRequirement:', meetsRequirement);
                return (
                  <span
                    key={skill.id || skill.name}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-colors duration-200
                      ${meetsRequirement ? 'bg-green-100 text-green-800 border-green-600' : 'bg-red-100 text-red-800 border-red-600'}`}
                  >
                    {skill.name} (Min {typeof minLevel === 'number' ? minLevel.toFixed(1) : minLevel})
                    {userSkillRating !== null && (
                      <span className="ml-2 text-xs opacity-75">
                        Your rating: {userSkillRating.toFixed(1)}
                      </span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {/* Task Duration Info Component */}
        {taskDetails?.current_user_id && (
          <TaskDurationInfo
            taskId={taskDetails.id}
            currentUserId={taskDetails.current_user_id}
            taskDuration={taskDetails.task_duration}
          />
        )}
      </div>
    );
  };

  const renderSubmissionsTab = () => {
    
    if (!taskDetails?.assignments || taskDetails.assignments.length === 0) {
      return (
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            {task.type === 'review' ? 'No review details found' : 'No submissions found'}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">
            {task.type === 'review' ? 'Review Details' : 'Submissions'} ({taskDetails.assignments.filter(a => a.status !== 'in_progress').length})
          </h4>
        </div>
        
        {taskDetails.assignments
          .filter(assignment => assignment.status !== 'in_progress')
          .map((assignment, index) => (
          <div key={assignment.id} className={`bg-white border rounded-lg p-4 ${
            assignment.is_submission_being_reviewed 
              ? 'border-yellow-300 bg-yellow-50' 
              : 'border-gray-200'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <User className={`h-4 w-4 ${
                    assignment.is_submission_being_reviewed ? 'text-yellow-600' : 'text-gray-400'
                  }`} />
                  <span className="text-sm font-medium text-gray-900">
                    {assignment.contributor_name || assignment.reviewer_name || 'Unknown User'}
                  </span>
                  {assignment.is_submission_being_reviewed && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Submission Being Reviewed
                    </span>
                  )}
                  <span className={getStatusBadge(assignment.status)}>
                    {assignment.status.replace(/_/g, ' ')}
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Started</p>
                    <p className="font-medium">{formatDate(assignment.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Submitted</p>
                    <p className="font-medium">{formatDate(assignment.submitted_at)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Last Updated</p>
                    <p className="font-medium">{formatDate(assignment.updated_at)}</p>
                  </div>
                </div>

                {assignment.notes && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">Notes</p>
                    <div className="bg-gray-50 p-3 rounded">
                      <p className="text-sm text-gray-700">{assignment.notes}</p>
                    </div>
                  </div>
                )}

                {assignment.submission_files && assignment.submission_files.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 mb-1">Submitted Files</p>
                    <div className="flex flex-wrap gap-2">
                      {assignment.submission_files.map((file, fileIndex) => (
                        <span key={fileIndex} className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                          <FileText className="h-3 w-3 mr-1" />
                          {file}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Show evaluation results if available */}
                {assignment.status === 'completed' && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Work Approved</span>
                    </div>
                    <p className="text-xs text-green-600 mt-1">
                      This work was approved by peer reviewers.
                    </p>
                  </div>
                )}
                
                {assignment.status === 'rejected' && (
                  <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 text-red-700">
                      <XCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Work Rejected</span>
                    </div>
                    <p className="text-xs text-red-600 mt-1">
                      This work was rejected by majority of peer reviewers. The task is now open for other contributors.
                    </p>
                    <div className="mt-2 p-2 bg-red-100 rounded border border-red-300">
                      <p className="text-xs text-red-700">
                        <strong>Note:</strong> The original contributor is blocked from this task for 30 days due to the rejection.
                      </p>
                    </div>
                  </div>
                )}
                
                {assignment.status === 'needs_review' && (
                  <div className="mt-3 p-3 bg-pink-50 rounded-lg border border-pink-200">
                    <div className="flex items-center gap-2 text-pink-700">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Needs Additional Review</span>
                    </div>
                    <p className="text-xs text-pink-600 mt-1">
                      This work received mixed reviews and needs additional evaluation.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderReviewsTab = () => {
    if (!taskDetails?.reviews || taskDetails.reviews.length === 0) {
      return (
        <div className="text-center py-8">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">No reviews found</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium text-gray-700">Reviews ({taskDetails.reviews.length})</h4>
        </div>
        
        {taskDetails.reviews.map((review, index) => (
          <div key={review.id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900">
                    {review.reviewer_name || 'Unknown Reviewer'}
                  </span>
                  <div className="flex items-center">
                    {review.is_approved ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={`ml-1 text-sm font-medium ${
                      review.is_approved ? 'text-green-700' : 'text-red-700'
                    }`}>
                      {review.is_approved ? 'Approved' : 'Rejected'}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                  <div>
                    <p className="text-gray-500">Reviewed On</p>
                    <p className="font-medium">{formatDate(review.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Decision</p>
                    <div className="flex items-center">
                      {review.is_approved ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`ml-1 text-sm font-medium ${
                        review.is_approved ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {review.is_approved ? 'Approved' : 'Rejected'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Always show Feedback cell, even if blank */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">Feedback</p>
                  <div className={`p-3 rounded ${
                    review.is_approved ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <p className={`text-sm ${
                      review.is_approved ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {review.feedback && review.feedback.trim() !== '' ? review.feedback : 'No feedback from reviewer'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderStatsTab = () => (
    <div className="space-y-6">
      {/* Task Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{taskDetails?.assignments_count || 0}</div>
          <div className="text-xs text-blue-600">Total Assignments</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{taskDetails?.active_assignments || 0}</div>
          <div className="text-xs text-green-600">Active Contributors</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-600">{taskDetails?.reviews_count || 0}</div>
          <div className="text-xs text-yellow-600">Reviews Received</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">{taskDetails?.approval_rate || 0}%</div>
          <div className="text-xs text-purple-600">Approval Rate</div>
        </div>
      </div>

      {/* Review Progress */}
      <div className="bg-orange-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-orange-700 mb-3">Review Progress</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-3 rounded border border-orange-200">
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {taskDetails?.reviews_count || 0} / {taskDetails?.num_reviewers || task.num_reviewers || '?'}
              </div>
              <div className="text-xs text-orange-600">Reviews Completed</div>
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-orange-200">
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {taskDetails?.num_reviewers || task.num_reviewers || 'Not set'}
              </div>
              <div className="text-xs text-orange-600">Required Reviews</div>
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-orange-200">
            <div className="text-center">
              <div className="text-lg font-bold text-orange-600">
                {taskDetails?.reviews_count >= (taskDetails?.num_reviewers || task.num_reviewers || 0) ? 'Complete' : 'Pending'}
              </div>
              <div className="text-xs text-orange-600">Review Status</div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Configuration Summary */}
      <div className="bg-indigo-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-indigo-700 mb-3">Task Configuration Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-3 rounded border border-indigo-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-indigo-600">Max Contributors:</span>
              <span className="text-sm font-medium text-indigo-900">
                {taskDetails?.max_parallel_contributors || task.max_parallel_contributors || 'Unlimited'}
              </span>
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-indigo-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-indigo-600">Time Limit:</span>
              <span className="text-sm font-medium text-indigo-900">
                {taskDetails?.task_duration || task.task_duration || 'No limit'} hours
              </span>
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-indigo-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-indigo-600">Task Compensation:</span>
              <span className="text-sm font-medium text-indigo-900">
                {formatCompensation(taskDetails?.compensation?.task || task.compensation?.task)}
              </span>
            </div>
          </div>
          <div className="bg-white p-3 rounded border border-indigo-200">
            <div className="flex justify-between items-center">
              <span className="text-sm text-indigo-600">Review Compensation:</span>
              <span className="text-sm font-medium text-indigo-900">
                {formatCompensation(taskDetails?.compensation?.review || task.compensation?.review)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Task Timeline</h4>
        <div className="space-y-3">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Task Created</p>
              <p className="text-xs text-gray-500">{formatDate(task.created_at)}</p>
            </div>
          </div>
          
          {taskDetails?.assignments?.map((assignment, index) => (
            <div key={assignment.id} className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {assignment.contributor_name} started working
                </p>
                <p className="text-xs text-gray-500">{formatDate(assignment.created_at)}</p>
              </div>
            </div>
          ))}
          
          {taskDetails?.assignments?.filter(a => a.submitted_at).map((assignment, index) => (
            <div key={`submitted-${assignment.id}`} className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {assignment.contributor_name} submitted work
                </p>
                <p className="text-xs text-gray-500">{formatDate(assignment.submitted_at)}</p>
              </div>
            </div>
          ))}
          
          {taskDetails?.reviews?.map((review, index) => (
            <div key={review.id} className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {review.reviewer_name} {review.is_approved ? 'approved' : 'rejected'} the work
                </p>
                <p className="text-xs text-gray-500">{formatDate(review.created_at)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Task Details: {task.title}
              </h3>
              <div className="flex items-center space-x-2">
                {/* Edit button - only show for task creators and when task is editable */}
                {(() => {
                  // Get user data from localStorage
                  const userData = JSON.parse(localStorage.getItem('userData'));
                  
                  // Check if current user is the task creator
                  // Try multiple possible fields where user_id might be stored
                  const taskUserId = taskDetails?.user_id || task.user_id || task.creator_id;
                  const isCreator = userData && userData.id && taskUserId && userData.id === taskUserId;
                  
                  // Check if task is editable (open, editing, or draft status)
                  const taskStatus = taskDetails?.status || task.status;
                  const isEditable = taskStatus === 'open' || taskStatus === 'editing' || taskStatus === 'draft';
                  
                  if (isCreator && isEditable) {
                    if (taskStatus === 'editing' && !isEditing) {
                      // Show "Continue Editing" button for tasks already in editing status
                      return (
                        <button
                          onClick={handleEditTask}
                          className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                          title="Continue editing this task"
                        >
                          <Edit3 className="h-5 w-5" />
                        </button>
                      );
                    } else if (taskStatus === 'open') {
                      // Show regular edit button for open tasks
                      return (
                        <button
                          onClick={handleEditTask}
                          disabled={isEditing}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                          title={isEditing ? "Already editing" : "Edit task"}
                        >
                          <Edit3 className="h-5 w-5" />
                        </button>
                      );
                    } else if (taskStatus === 'draft') {
                      // Show edit button for draft tasks
                      return (
                        <button
                          onClick={handleEditTask}
                          disabled={isEditing}
                          className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                          title={isEditing ? "Already editing" : "Edit draft"}
                        >
                          <Edit3 className="h-5 w-5" />
                        </button>
                      );
                    }
                  }
                  
                  return null;
                })()}
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {taskDetails?.assignments?.length > 0 || taskDetails?.reviews?.length > 0 || task.type === 'review' ? (
                // Show all tabs for tasks with data or review tasks
                ['overview', 'submissions', 'reviews', 'stats'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))
              ) : (
                // Contributor view: only show overview tab
                <button
                  className="py-4 px-1 border-b-2 font-medium text-sm border-blue-500 text-blue-600"
                >
                  Overview
                </button>
              )}
            </nav>
          </div>

          {/* Edit Mode Notice and Status Messages */}
          {isEditing && (
            <div className="bg-yellow-50 border-b border-yellow-200 px-6 py-3">
              <div className="flex items-center space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-yellow-800 font-medium">Task in Editing Mode</p>
                  <p className="text-yellow-700 text-sm">
                    This task is currently being edited and cannot be undertaken by contributors. 
                    Use "Save Draft" to save your progress or "Finish Editing" to publish the task.
                  </p>
                </div>
              </div>
            </div>
          )}

          {editError && (
            <div className="bg-red-50 border-b border-red-200 px-6 py-3">
              <p className="text-red-700 text-sm">{editError}</p>
            </div>
          )}

          {editSuccess && (
            <div className="bg-green-50 border-b border-green-200 px-6 py-3">
              <p className="text-green-700 text-sm">{editSuccess}</p>
            </div>
          )}

          {/* Content */}
          <div className="bg-white px-6 py-6 max-h-96 overflow-y-auto">
            {error ? (
              <div className="text-center py-8">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            ) : (
              <>
                {activeTab === 'overview' && renderOverviewTab()}
                {activeTab === 'submissions' && renderSubmissionsTab()}
                {activeTab === 'reviews' && renderReviewsTab()}
                {activeTab === 'stats' && renderStatsTab()}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 flex justify-end space-x-3">
            {/* Edit Mode Action Buttons */}
            {isEditing && (
              <>
                {/* Save Draft Button - Available for all editable tasks */}
                <button
                  onClick={handleSaveAsDraft}
                  disabled={editLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {editLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Draft</span>
                    </>
                  )}
                </button>
                
                {/* Finish Editing Button - Available for all editable tasks */}
                <button
                  onClick={handleFinishEditing}
                  disabled={editLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {editLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Finishing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon className="h-4 w-4" />
                      <span>Finish Editing</span>
                    </>
                  )}
                </button>
              </>
            )}

            {/* Regular Action Buttons (when not editing) */}
            {!isEditing && (
              <>
                {/* Submit Work Button for Active Tasks assigned to current user */}
                {onSubmit && task.status === 'in_progress' && task.type === 'task' && task.has_assignment && (
                  <button
                    onClick={() => onSubmit(task)}
                    className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700"
                  >
                    Submit Work
                  </button>
                )}
                
                {/* Submit Review Button for Active Review Tasks assigned to current user */}
                {onSubmit && task.status === 'in_progress' && task.type === 'review' && task.has_assignment && (
                  <button
                    onClick={() => onSubmit(task)}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md text-sm font-medium hover:bg-yellow-700"
                  >
                    Submit Review
                  </button>
                )}
                
                {/* Undertake Task Button */}
                {onUndertake && 
                  canUndertake?.can_undertake && 
                  ((task.status === 'open' || task.status === 'available' || !task.status) || 
                  (task.type === 'review' && task.status === 'submitted'))
                && (
                  <button
                    onClick={() => onUndertake(task)}
                    className={`px-4 py-2 text-white rounded-md text-sm font-medium hover:bg-opacity-90 ${
                      task.type === 'review' 
                        ? 'bg-yellow-600 hover:bg-yellow-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {task.type === 'review' ? 'Review Task' : 'Undertake Task'}
                  </button>
                )}
                
                {/* Cannot Undertake Button */}
                {onUndertake && 
                  canUndertake && 
                  !canUndertake.can_undertake && 
                  (task.status === 'open' || task.status === 'available' || !task.status)
                && (
                  <button
                    disabled
                    className="px-4 py-2 bg-gray-400 text-white rounded-md text-sm font-medium cursor-not-allowed"
                    title={canUndertake.reason}
                  >
                    Cannot Undertake
                  </button>
                )}
                
                {/* Resubmit Button */}
                {onResubmit && task.status === 'rejected' && (
                  <button
                    onClick={() => onResubmit(task)}
                    className="px-4 py-2 bg-yellow-600 text-white rounded-md text-sm font-medium hover:bg-yellow-700"
                  >
                    Reset for Resubmission
                  </button>
                )}
              </>
            )}
            
            {/* Share and Close Buttons - only show when not editing */}
            {!isEditing && (
              <>
                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 flex items-center space-x-2"
                >
                  <Share2 className="h-4 w-4" />
                  <span>{shareSuccess ? 'Copied!' : 'Share'}</span>
                </button>
                
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailModal;