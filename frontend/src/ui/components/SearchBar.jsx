import { TextField, InputAdornment, IconButton } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import PropTypes from 'prop-types';
import '../../styles/components/searchbar.css';

/**
 * Reusable SearchBar Component
 *
 * A flexible search input component that can be used across admin and customer pages.
 * Supports customizable placeholder, styling, and clear functionality.
 *
 * @param {string} value - Current search value
 * @param {function} onChange - Callback function when search value changes
 * @param {string} placeholder - Placeholder text for the search input
 * @param {string} variant - Material-UI TextField variant ('outlined', 'filled', 'standard')
 * @param {string} size - Size of the search bar ('small', 'medium')
 * @param {string} className - Additional CSS classes
 * @param {boolean} fullWidth - Whether the search bar should take full width
 * @param {boolean} showClearButton - Whether to show clear button when input has value
 * @param {object} sx - Material-UI sx prop for custom styling
 * @param {boolean} disabled - Whether the search bar is disabled
 * @param {boolean} autoFocus - Whether to auto-focus the input on mount
 */
function SearchBar({
  value = '',
  onChange,
  placeholder = 'Search...',
  variant = 'outlined',
  size = 'small',
  className = '',
  fullWidth = false,
  showClearButton = true,
  sx = {},
  disabled = false,
  autoFocus = false,
  ...otherProps
}) {
  const handleClear = () => {
    onChange({ target: { value: '' } });
  };

  return (
    <TextField
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      disabled={disabled}
      autoFocus={autoFocus}
      className={`search-bar ${className}`}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon sx={{ color: 'action.active' }} />
          </InputAdornment>
        ),
        endAdornment:
          showClearButton && value ? (
            <InputAdornment position="end">
              <IconButton
                aria-label="clear search"
                onClick={handleClear}
                edge="end"
                size="small"
                sx={{
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : null,
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          backgroundColor: 'background.paper',
          '&:hover fieldset': {
            borderColor: 'primary.main',
          },
          '&.Mui-focused fieldset': {
            borderColor: 'primary.main',
          },
        },
        ...sx,
      }}
      {...otherProps}
    />
  );
}

SearchBar.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  variant: PropTypes.oneOf(['outlined', 'filled', 'standard']),
  size: PropTypes.oneOf(['small', 'medium']),
  className: PropTypes.string,
  fullWidth: PropTypes.bool,
  showClearButton: PropTypes.bool,
  sx: PropTypes.object,
  disabled: PropTypes.bool,
  autoFocus: PropTypes.bool,
};

export default SearchBar;
