import React, { useState } from 'react';
import { Search, Filter, X, Tag, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { useTaskStore } from '../../store';
import type { TaskFilter } from '../../types';

export const FilterBar: React.FC = () => {
  const { filter, setFilter, clearFilter } = useTaskStore();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleStatusChange = (status: string) => {
    setFilter({ status: status as TaskFilter['status'] });
  };

  const handlePriorityChange = (priority: string) => {
    setFilter({ priority: priority as TaskFilter['priority'] });
  };

  const handleDueDateChange = (dueDate: string) => {
    setFilter({ dueDate: dueDate as TaskFilter['dueDate'] });
  };

  const handleSearchChange = (search: string) => {
    setFilter({ search });
  };

  const handleCategoryChange = (category: string) => {
    setFilter({ category });
  };

  const handleAssigneeChange = (assignee: string) => {
    setFilter({ assignee });
  };

  const handleClearFilters = () => {
    clearFilter();
    setShowAdvanced(false);
  };

  const hasActiveFilters = Object.values(filter).some(value => value && value !== '');

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'todo', label: 'Todo' },
    { value: 'in-progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ];

  const priorityOptions = [
    { value: '', label: 'All Priorities' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  const dueDateOptions = [
    { value: '', label: 'All Dates' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'today', label: 'Today' },
    { value: 'this-week', label: 'This Week' },
    { value: 'this-month', label: 'This Month' },
    { value: 'no-due-date', label: 'No Due Date' },
  ];

  return (
    <Card className="p-4 mb-6">
      <div className="space-y-4">
        {/* Basic Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={filter.search || ''}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="min-w-40">
            <select
              value={filter.status || ''}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              aria-label="Filter by status"
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="min-w-40">
            <select
              value={filter.priority || ''}
              onChange={(e) => handlePriorityChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              aria-label="Filter by priority"
            >
              {priorityOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date Filter */}
          <div className="min-w-40">
            <select
              value={filter.dueDate || ''}
              onChange={(e) => handleDueDateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              aria-label="Filter by due date"
            >
              {dueDateOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Advanced Filters Toggle */}
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Advanced
          </Button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="flex items-center gap-2 text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-600"
            >
              <X className="h-4 w-4" />
              Clear All
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Tag className="inline h-4 w-4 mr-1" />
                  Category
                </label>
                <input
                  type="text"
                  placeholder="Filter by category..."
                  value={filter.category || ''}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Assignee Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <User className="inline h-4 w-4 mr-1" />
                  Assignee
                </label>
                <input
                  type="text"
                  placeholder="Filter by assignee..."
                  value={filter.assignee || ''}
                  onChange={(e) => handleAssigneeChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              {/* Tags Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Tag className="inline h-4 w-4 mr-1" />
                  Tags
                </label>
                <input
                  type="text"
                  placeholder="Filter by tags..."
                  value={filter.tags || ''}
                  onChange={(e) => setFilter({ tags: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            {/* Filter Summary */}
            {hasActiveFilters && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      Active Filters:
                    </span>
                    {filter.search && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                        Search: "{filter.search}"
                      </span>
                    )}
                    {filter.status && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                        Status: {statusOptions.find(opt => opt.value === filter.status)?.label}
                      </span>
                    )}
                    {filter.priority && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                        Priority: {priorityOptions.find(opt => opt.value === filter.priority)?.label}
                      </span>
                    )}
                    {filter.dueDate && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                        Due: {dueDateOptions.find(opt => opt.value === filter.dueDate)?.label}
                      </span>
                    )}
                    {filter.category && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200">
                        Category: {filter.category}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};
