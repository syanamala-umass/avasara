import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, Clock, ExternalLink, Plus, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const IdeaDetailPage = () => {
  const [idea, setIdea] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simulate fetching idea data
  useEffect(() => {
    const fetchIdeaData = async () => {
      try {
        // In a real app, you would fetch from your API
        // const response = await fetch(`${process.env.REACT_APP_API_URL}/ideas/1`);
        // const data = await response.json();
        
        // Simulate API response
        const data = {
          id: 1,
          title: 'AI-powered content generator',
          description: 'A tool that uses artificial intelligence to automatically generate SEO-friendly content based on keywords and topics provided by the user. The system will analyze top-ranking content, understand context, and create original articles that match the user\'s brand voice.',
          goal: 'To reduce content creation time by 70% while maintaining high quality and SEO optimization, enabling businesses to scale their content marketing efforts without proportionally increasing costs.',
          action_plan: [
            'Phase 1: Research and prototype development (2 months)',
            'Phase 2: MVP development and beta testing (3 months)',
            'Phase 3: Initial launch with core features (1 month)',
            'Phase 4: Gather feedback and implement improvements (2 months)',
            'Phase 5: Full launch with premium features (1 month)'
          ],
          status: 'in_progress',
          created_at: '2025-03-15',
          updated_at: '2025-04-05',
          open_tasks: [
            { id: 1, title: 'Develop NLP model for content generation', deadline: '2025-05-15', assigned_to: 'Alex Chen' },
            { id: 2, title: 'Create user interface design for content dashboard', deadline: '2025-05-01', assigned_to: null },
            { id: 3, title: 'Set up content quality evaluation metrics', deadline: '2025-05-10', assigned_to: 'Maria Lopez' }
          ],
          equity_distribution: [
            { stakeholder: 'Founder (Sarah Johnson)', percentage: 60 },
            { stakeholder: 'Co-Founder (David Park)', percentage: 25 },
            { stakeholder: 'Early Contributors', percentage: 10 },
            { stakeholder: 'Option Pool', percentage: 5 }
          ],
          sales_data: [
            { month: 'Jan', revenue: 0 },
            { month: 'Feb', revenue: 0 },
            { month: 'Mar', revenue: 1200 },
            { month: 'Apr', revenue: 3500 },
            { month: 'May', revenue: 7800 },
            { month: 'Jun', revenue: 12000 },
            { month: 'Jul', revenue: 18500 },
            { month: 'Aug', revenue: 24000 }
          ],
          total_revenue: 67000,
          projected_annual_revenue: 150000
        };
        
        setIdea(data);
      } catch (err) {
        console.error('Error fetching idea data:', err);
        setError('Failed to load idea details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchIdeaData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading idea details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow max-w-md">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.history.back()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-lg shadow max-w-md">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Idea Not Found</h2>
          <p className="text-gray-600 mb-4">The idea you're looking for doesn't exist or has been removed.</p>
          <button 
            onClick={() => window.history.back()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center">
            <button 
              onClick={() => window.history.back()} 
              className="mr-4 p-2 rounded-full hover:bg-gray-100 transition"
            >
              <ArrowLeft className="h-5 w-5 text-gray-500" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 flex-1">{idea.title}</h1>
            <div className="flex items-center space-x-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                idea.status === 'completed' ? 'bg-green-100 text-green-800' : 
                idea.status === 'in_progress' ? 'bg-blue-100 text-blue-800' : 
                'bg-yellow-100 text-yellow-800'
              }`}>
                {idea.status === 'completed' ? 'Completed' : 
                 idea.status === 'in_progress' ? 'In Progress' : 
                 'Planning'}
              </span>
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                Edit Idea
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Idea Information */}
          <div className="lg:col-span-2">
            {/* Description Section */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Description</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-700 whitespace-pre-line">{idea.description}</p>
              </div>
            </div>

            {/* Goal Section */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Goal</h2>
              </div>
              <div className="p-6">
                <p className="text-gray-700">{idea.goal}</p>
              </div>
            </div>

            {/* Action Plan Section */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Action Plan</h2>
              </div>
              <div className="p-6">
                <ol className="space-y-4">
                  {idea.action_plan.map((step, index) => (
                    <li key={index} className="flex">
                      <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-medium text-sm mr-3">
                        {index + 1}
                      </div>
                      <div className="text-gray-700">{step}</div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

            {/* Open Tasks Section */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
              <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Open Tasks</h2>
                <button className="flex items-center text-sm text-blue-600 hover:text-blue-800">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Task
                </button>
              </div>
              <div className="p-6">
                {idea.open_tasks.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No open tasks at the moment.</p>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {idea.open_tasks.map(task => (
                      <li key={task.id} className="py-4 flex items-center justify-between">
                        <div>
                          <h3 className="text-base font-medium text-gray-900">{task.title}</h3>
                          <div className="mt-1 flex items-center text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-1 text-yellow-500" />
                            <span>Due: {new Date(task.deadline).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                            {task.assigned_to && (
                              <>
                                <span className="mx-2">•</span>
                                <span>Assigned to: {task.assigned_to}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-3">
                          {!task.assigned_to && (
                            <button className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm hover:bg-blue-200 transition">
                              Pick Up
                            </button>
                          )}
                          <button className="text-gray-400 hover:text-gray-600">
                            <ExternalLink className="h-5 w-5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Metrics & Stats */}
          <div>
            {/* Summary Card */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Summary</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="text-sm text-gray-500">Created</div>
                    <div className="mt-1 font-medium">
                      {new Date(idea.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="text-sm text-gray-500">Last Updated</div>
                    <div className="mt-1 font-medium">
                      {new Date(idea.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="text-sm text-gray-500">Open Tasks</div>
                    <div className="mt-1 font-medium">{idea.open_tasks.length}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="text-sm text-gray-500">Status</div>
                    <div className="mt-1 font-medium capitalize">{idea.status.replace('_', ' ')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Equity Distribution Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Equity Distribution</h2>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stakeholder
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Percentage
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {idea.equity_distribution.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.stakeholder}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                            {item.percentage}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Equity Distribution Visualization */}
                <div className="mt-6 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <div className="flex h-full">
                      {idea.equity_distribution.map((item, index) => (
                        <div 
                          key={index} 
                          className="h-full" 
                          style={{ 
                            width: `${item.percentage}%`,
                            backgroundColor: [
                              '#3B82F6', // blue-500
                              '#10B981', // emerald-500
                              '#F59E0B', // amber-500
                              '#6366F1', // indigo-500
                            ][index % 4],
                            position: 'relative'
                          }}
                        >
                          {item.percentage >= 10 && (
                            <div className="absolute inset-0 flex items-center justify-center text-white font-medium text-sm">
                              {item.percentage}%
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Sales & Revenue Chart */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Sales & Revenue</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="text-sm text-gray-500">Total Revenue</div>
                    <div className="mt-1 text-xl font-medium text-gray-900">${idea.total_revenue.toLocaleString()}</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded">
                    <div className="text-sm text-gray-500">Projected Annual</div>
                    <div className="mt-1 text-xl font-medium text-gray-900">${idea.projected_annual_revenue.toLocaleString()}</div>
                  </div>
                </div>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={idea.sales_data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                      <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IdeaDetailPage;