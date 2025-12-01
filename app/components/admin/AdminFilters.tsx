'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { X } from 'lucide-react';
import { DateRangeFilter } from './DateRangeFilter';
import { Badge } from '@/components/ui/badge';
import styles from './AdminFilters.module.scss';

export type FilterOption = {
  value: string;
  label: string;
};

type CustomFilter =
  | {
      key: string;
      label: string;
      type?: 'select';
      options: FilterOption[];
    }
  | {
      key: string;
      label: string;
      type: 'text';
      placeholder?: string;
    };

export type FilterConfig = {
  dateFilter?: boolean;
  statusFilter?: boolean | FilterOption[];
  roleFilter?: boolean | FilterOption[];
  locationFilter?: boolean;
  typeFilter?: boolean | FilterOption[];
  customFilters?: CustomFilter[];
  sortOptions?: FilterOption[];
};

type AdminFiltersProps = {
  config: FilterConfig;
  basePath: string;
};

export function AdminFilters({ config, basePath }: AdminFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const customFiltersSignature = JSON.stringify(config.customFilters || []);

  // Get default status value from config
  const getDefaultStatus = () => {
    if (Array.isArray(config.statusFilter) && config.statusFilter.length > 0) {
      // Prefer 'all' when available so no filter is applied by default
      const hasAllOption = config.statusFilter.some(opt => opt.value === 'all');
      if (hasAllOption) return 'all';
      return config.statusFilter[0].value;
    }
    return 'all';
  };

  // State for all filter values
  const [dateRange, setDateRange] = useState(searchParams.get('dateRange') || 'any');
  const [status, setStatus] = useState(searchParams.get('status') || getDefaultStatus());
  const [role, setRole] = useState(searchParams.get('role') || 'all');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [type, setType] = useState(searchParams.get('type') || 'all');
  const [sortOrder, setSortOrder] = useState(searchParams.get('sort') || 'latest');
  const [customFilterValues, setCustomFilterValues] = useState<Record<string, string>>({});

  // Initialize custom filter values from URL
  useEffect(() => {
    if (config.customFilters) {
      const values: Record<string, string> = {};
      config.customFilters.forEach((filter) => {
        values[filter.key] = searchParams.get(filter.key) || '';
      });
      setCustomFilterValues((prev) => {
        const hasChanges =
          Object.keys(values).length !== Object.keys(prev).length ||
          Object.entries(values).some(([key, value]) => prev[key] !== value);

        return hasChanges ? values : prev;
      });
    }
  }, [customFiltersSignature, searchParamsString]);

  // Sync with URL params on mount and when they change
  useEffect(() => {
    setDateRange(searchParams.get('dateRange') || 'any');
    setStatus(searchParams.get('status') || getDefaultStatus());
    setRole(searchParams.get('role') || 'all');
    setLocation(searchParams.get('location') || '');
    setType(searchParams.get('type') || 'all');
    setSortOrder(searchParams.get('sort') || 'latest');
  }, [searchParamsString]);

  // Apply filters to URL
  const applyFilters = useCallback(() => {
    const params = new URLSearchParams();

    // Add date range
    if (dateRange && dateRange !== 'any') {
      params.set('dateRange', dateRange);
    }

    // Add status - always include it in URL if not default 'all', or if it's the configured default
    const defaultStatus = getDefaultStatus();
    if (status && (status !== 'all' || defaultStatus !== 'all')) {
      params.set('status', status);
    }

    // Add role
    if (role && role !== 'all') {
      params.set('role', role);
    }

    // Add location
    if (location && location.trim()) {
      params.set('location', location.trim());
    }

    // Add type
    if (type && type !== 'all') {
      params.set('type', type);
    }

    // Add sort
    if (sortOrder && sortOrder !== 'latest') {
      params.set('sort', sortOrder);
    }

    // Add custom filters
    Object.entries(customFilterValues).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value);
      }
    });

    const query = params.toString();
    router.replace(query ? `${basePath}?${query}` : basePath, { scroll: false });
  }, [dateRange, status, role, location, type, sortOrder, customFilterValues, basePath, router]);

  // Auto-apply when filters change (with debounce for text inputs)
  useEffect(() => {
    const timer = setTimeout(() => {
      applyFilters();
    }, 300);

    return () => clearTimeout(timer);
  }, [applyFilters]);

  // Clear all filters - reset to defaults
  const handleClearFilters = () => {
    setDateRange('any');
    setStatus(getDefaultStatus());
    setRole('all');
    setLocation('');
    setType('all');
    setSortOrder('latest');
    setCustomFilterValues({});

    // Build URL with default status if it's not 'all'
    const defaultStatus = getDefaultStatus();
    if (defaultStatus !== 'all') {
      const params = new URLSearchParams();
      params.set('status', defaultStatus);
      router.replace(`${basePath}?${params.toString()}`, { scroll: false });
    } else {
      router.replace(basePath, { scroll: false });
    }
  };

  // Remove individual filter
  const removeFilter = (filterKey: string) => {
    switch (filterKey) {
      case 'dateRange':
        setDateRange('any');
        break;
      case 'status':
        setStatus('all');
        break;
      case 'role':
        setRole('all');
        break;
      case 'location':
        setLocation('');
        break;
      case 'type':
        setType('all');
        break;
      default:
        // Handle custom filters
        if (customFilterValues[filterKey]) {
          setCustomFilterValues((prev) => ({ ...prev, [filterKey]: '' }));
        }
    }
  };

  // Get human-readable date range label
  const getDateRangeLabel = (range: string): string => {
    const labels: Record<string, string> = {
      '1d': 'Last 24 hours',
      '3d': 'Last 3 days',
      '7d': 'Last 7 days',
      '14d': 'Last 14 days',
      '30d': 'Last 30 days',
    };

    if (range in labels) {
      return labels[range];
    }

    // Custom range format: "2024-01-01,2024-12-31"
    if (range.includes(',')) {
      const [start, end] = range.split(',');
      return `${start} to ${end}`;
    }

    return range;
  };

  // Check if any filters are active (beyond defaults)
  const defaultStatus = getDefaultStatus();
  const hasActiveFilters =
    dateRange !== 'any' ||
    status !== defaultStatus ||
    role !== 'all' ||
    location.trim() !== '' ||
    type !== 'all' ||
    Object.values(customFilterValues).some((v) => v && v !== 'all');

  // Get default or custom status options
  const statusOptions: FilterOption[] = Array.isArray(config.statusFilter)
    ? config.statusFilter
    : [
        { value: 'all', label: 'All statuses' },
        { value: 'approved', label: 'Approved' },
        { value: 'pending', label: 'Pending' },
        { value: 'rejected', label: 'Rejected' },
      ];

  // Get default or custom role options
  const roleOptions: FilterOption[] = Array.isArray(config.roleFilter)
    ? config.roleFilter
    : [
        { value: 'all', label: 'All roles' },
        { value: 'talent', label: 'Talent' },
        { value: 'mentor', label: 'Mentor' },
        { value: 'recruiter', label: 'Recruiter' },
      ];

  // Get default or custom type options
  const typeOptions: FilterOption[] = Array.isArray(config.typeFilter)
    ? config.typeFilter
    : [
        { value: 'all', label: 'All types' },
        { value: 'remote', label: 'Remote' },
        { value: 'hybrid', label: 'Hybrid' },
        { value: 'onsite', label: 'On-site' },
      ];

  // Get sort options
  const sortOptions: FilterOption[] = config.sortOptions || [
    { value: 'latest', label: 'Latest first' },
    { value: 'oldest', label: 'Oldest first' },
  ];

  return (
    <div className={styles.adminFilters}>
      {/* First Row: Date Range */}
      {config.dateFilter && (
        <div className={styles.dateRow}>
          <div className={styles.dateRangeGroup}>
            <label className={styles.filterLabel}>Date Range</label>
            <DateRangeFilter value={dateRange} onChange={setDateRange} />
          </div>
        </div>
      )}

      {/* Second Row: Other Filters */}
      <div className={styles.filterRow}>
        {/* Status Filter */}
        {config.statusFilter && (
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={styles.filterSelect}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Role Filter */}
        {config.roleFilter && (
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className={styles.filterSelect}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Location Filter */}
        {config.locationFilter && (
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City or country..."
              className={styles.filterInput}
            />
          </div>
        )}

        {/* Type Filter */}
        {config.typeFilter && (
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={styles.filterSelect}
            >
              {typeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Custom Filters */}
        {config.customFilters?.map((filter) => (
          <div key={filter.key} className={styles.filterGroup}>
            <label className={styles.filterLabel}>{filter.label}</label>
            {filter.type === 'text' ? (
              <input
                type="text"
                value={customFilterValues[filter.key] || ''}
                onChange={(e) =>
                  setCustomFilterValues((prev) => ({
                    ...prev,
                    [filter.key]: e.target.value,
                  }))
                }
                className={styles.filterInput}
                placeholder={filter.placeholder || 'Type to filter...'}
              />
            ) : (
              <select
                value={customFilterValues[filter.key] || ''}
                onChange={(e) =>
                  setCustomFilterValues((prev) => ({ ...prev, [filter.key]: e.target.value }))
                }
                className={styles.filterSelect}
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}

        {/* Sort */}
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel}>Sort by</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className={styles.filterSelect}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>&nbsp;</label>
            <button onClick={handleClearFilters} className={styles.clearBtn}>
              Clear filters
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
