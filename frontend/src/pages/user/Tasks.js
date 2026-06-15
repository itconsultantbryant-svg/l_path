import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(null);
  const [hasActivePackages, setHasActivePackages] = useState(true);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  useEffect(() => {
    fetchTasks();
    fetchHistory();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await axios.get('/tasks/daily');
      const data = res.data.data || {};
      setTasks(data.tasks || []);
      setHasActivePackages(data.hasActivePackages !== false);
    } catch (error) {
      toast.error('Error fetching tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get('/tasks/history', { params: { days: 7 } });
      setHistory(res.data.data.history || []);
    } catch (error) {
      console.error('Error fetching task history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const completeTask = async (taskId, userPackageId = null) => {
    setCompleting(taskId);
    try {
      await axios.post(`/tasks/${taskId}/complete`, { userPackageId });
      toast.success('Task completed! Reward credited.');
      fetchTasks();
      fetchHistory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Task completion failed');
    } finally {
      setCompleting(null);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">Daily Tasks</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tasks.map((task) => {
          const displayReward = task.effectiveRewardAmount ?? task.rewardAmount;
          return (
          <div key={task.id} className="bg-white rounded-lg shadow p-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-4">
              <div>
                <h3 className="text-xl font-bold">{task.title}</h3>
                {task.packageName && (
                  <p className="text-xs text-gray-500 mt-1">Package: {task.packageName}</p>
                )}
              </div>
              {task.isCompleted && (
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                  Completed
                </span>
              )}
            </div>
            <p className="text-gray-600 mb-4">{task.description}</p>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="text-lg font-semibold text-primary-600">
                Reward: {parseFloat(displayReward).toFixed(2)} LRD
              </div>
              <button
                onClick={() => completeTask(task.id, task.userPackageId)}
                disabled={task.isCompleted || completing === task.id}
                className={`px-4 py-2 rounded text-sm font-medium ${
                  task.isCompleted
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-primary-600 text-white hover:bg-primary-700'
                }`}
              >
                {completing === task.id ? 'Completing...' : task.isCompleted ? 'Completed' : 'Complete'}
              </button>
            </div>
          </div>
        );
        })}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          {hasActivePackages ? (
            'No tasks available today'
          ) : (
            <div>
              <p>Purchase a package to unlock tasks</p>
              <Link
                to="/dashboard/packages"
                className="inline-block mt-4 px-4 py-2 bg-primary-600 text-white rounded-md text-sm font-medium hover:bg-primary-700"
              >
                View Packages
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="mt-10">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4">Task History (Last 7 Days)</h2>
        {historyLoading ? (
          <div className="text-center py-6 text-gray-500">Loading history...</div>
        ) : (
          <div className="space-y-6">
            {history.map((day) => {
              const dayTasks = day.tasks || [];
              return (
              <div key={day.date} className="bg-white rounded-lg shadow p-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div className="font-semibold text-gray-900">
                    {new Date(day.date).toLocaleDateString()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {dayTasks.filter((task) => task.isCompleted).length}/{dayTasks.length} completed
                  </div>
                </div>
                {dayTasks.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    {day.hasActivePackages
                      ? 'No tasks available.'
                      : 'No active package for this day.'}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {dayTasks.map((task) => (
                      <div key={task.id} className="py-3 flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{task.title}</div>
                          {task.packageName && (
                            <div className="text-xs text-gray-500">Package: {task.packageName}</div>
                          )}
                        </div>
                        <div className="text-sm">
                          {task.isCompleted ? (
                            <span className="px-2 py-1 rounded bg-green-100 text-green-800">
                              Completed
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800">
                              Not completed
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;

