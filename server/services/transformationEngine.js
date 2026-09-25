/**
 * Transformation Engine for StreamWeaver
 * Executes transformation rules (filter, map/rename, type_cast, deduplicate, aggregate)
 * on row datasets in-memory or in stream steps.
 */

/**
 * Validates transformation configuration object based on its type
 * @param {string} type 
 * @param {Object} config 
 * @returns {{ valid: boolean, message?: string }}
 */
function validateTransformationConfig(type, config) {
  if (!config || typeof config !== 'object') {
    return { valid: false, message: 'Config object is required' };
  }

  switch (type) {
    case 'filter':
      if (!config.column) return { valid: false, message: 'Filter requires a "column" field' };
      if (!config.operator) return { valid: false, message: 'Filter requires an "operator" field' };
      const validOperators = ['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'greater_than_or_equal', 'less_than_or_equal', 'is_null', 'is_not_null'];
      if (!validOperators.includes(config.operator)) {
        return { valid: false, message: `Operator must be one of: ${validOperators.join(', ')}` };
      }
      return { valid: true };

    case 'rename':
    case 'map':
      if (!config.sourceColumn) return { valid: false, message: 'Requires "sourceColumn"' };
      if (!config.targetColumn) return { valid: false, message: 'Requires "targetColumn"' };
      return { valid: true };

    case 'type_cast':
      if (!config.column) return { valid: false, message: 'Type cast requires a "column"' };
      if (!config.targetType || !['integer', 'float', 'string', 'boolean', 'date'].includes(config.targetType)) {
        return { valid: false, message: 'Target type must be integer, float, string, boolean, or date' };
      }
      return { valid: true };

    case 'deduplicate':
      if (!Array.isArray(config.columns) || config.columns.length === 0) {
        return { valid: false, message: 'Deduplicate requires an array of "columns"' };
      }
      return { valid: true };

    case 'aggregate':
      if (!config.aggregateColumn) return { valid: false, message: 'Aggregate requires "aggregateColumn"' };
      if (!config.function || !['sum', 'avg', 'min', 'max', 'count'].includes(config.function)) {
        return { valid: false, message: 'Aggregate function must be sum, avg, min, max, or count' };
      }
      if (!config.targetColumn) return { valid: false, message: 'Aggregate requires "targetColumn"' };
      return { valid: true };

    case 'custom':
      return { valid: true };

    default:
      return { valid: false, message: `Unknown transformation type: ${type}` };
  }
}

/**
 * Cast a single value to target type
 * @param {any} val 
 * @param {string} targetType 
 */
function castValue(val, targetType) {
  if (val === null || val === undefined || val === '') return null;
  const str = String(val).trim();

  switch (targetType) {
    case 'integer': {
      const num = parseInt(str, 10);
      return isNaN(num) ? null : num;
    }
    case 'float': {
      const num = parseFloat(str);
      return isNaN(num) ? null : num;
    }
    case 'boolean': {
      return ['true', '1', 'yes', 'y'].includes(str.toLowerCase());
    }
    case 'date': {
      const d = new Date(str);
      return isNaN(d.getTime()) ? null : d.toISOString();
    }
    case 'string':
    default:
      return str;
  }
}

/**
 * Apply a single filter rule to a row
 * @param {Object} row 
 * @param {Object} config 
 * @returns {boolean}
 */
function evaluateFilter(row, config) {
  const { column, operator, value } = config;
  const rawVal = row[column];

  if (operator === 'is_null') {
    return rawVal === undefined || rawVal === null || String(rawVal).trim() === '';
  }
  if (operator === 'is_not_null') {
    return rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '';
  }

  if (rawVal === undefined || rawVal === null) return false;

  const valStr = String(rawVal).trim();
  const targetStr = String(value ?? '').trim();

  switch (operator) {
    case 'equals':
      return valStr.toLowerCase() === targetStr.toLowerCase();
    case 'not_equals':
      return valStr.toLowerCase() !== targetStr.toLowerCase();
    case 'contains':
      return valStr.toLowerCase().includes(targetStr.toLowerCase());
    case 'greater_than':
      return Number(valStr) > Number(targetStr);
    case 'less_than':
      return Number(valStr) < Number(targetStr);
    case 'greater_than_or_equal':
      return Number(valStr) >= Number(targetStr);
    case 'less_than_or_equal':
      return Number(valStr) <= Number(targetStr);
    default:
      return true;
  }
}

/**
 * Apply a single transformation rule to an array of rows
 * @param {Array<Object>} rows 
 * @param {Object} transformation - { type, config }
 * @returns {Array<Object>} transformed rows
 */
function applySingleTransformation(rows, transformation) {
  const { type, config } = transformation;

  switch (type) {
    case 'filter': {
      return rows.filter((r) => evaluateFilter(r, config));
    }

    case 'rename': {
      const { sourceColumn, targetColumn } = config;
      return rows.map((row) => {
        const copy = { ...row };
        if (sourceColumn in copy) {
          copy[targetColumn] = copy[sourceColumn];
          delete copy[sourceColumn];
        }
        return copy;
      });
    }

    case 'map': {
      const { sourceColumn, targetColumn } = config;
      return rows.map((row) => ({
        ...row,
        [targetColumn]: row[sourceColumn] !== undefined ? row[sourceColumn] : null,
      }));
    }

    case 'type_cast': {
      const { column, targetType } = config;
      return rows.map((row) => ({
        ...row,
        [column]: castValue(row[column], targetType),
      }));
    }

    case 'deduplicate': {
      const cols = config.columns || [];
      const seen = new Set();
      return rows.filter((row) => {
        const key = cols.map((c) => String(row[c] ?? '')).join('||');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    case 'aggregate': {
      const { groupBy = [], aggregateColumn, function: fn, targetColumn } = config;
      const groups = new Map();

      rows.forEach((row) => {
        const groupKey = groupBy.map((g) => String(row[g] ?? '')).join('||');
        if (!groups.has(groupKey)) {
          const groupMeta = {};
          groupBy.forEach((g) => {
            groupMeta[g] = row[g];
          });
          groups.set(groupKey, { meta: groupMeta, values: [] });
        }
        const val = Number(row[aggregateColumn]);
        if (!isNaN(val)) {
          groups.get(groupKey).values.push(val);
        }
      });

      const aggregatedResult = [];
      groups.forEach(({ meta, values }) => {
        let resultVal = 0;
        if (fn === 'count') {
          resultVal = values.length;
        } else if (values.length > 0) {
          if (fn === 'sum') resultVal = values.reduce((a, b) => a + b, 0);
          else if (fn === 'avg') resultVal = values.reduce((a, b) => a + b, 0) / values.length;
          else if (fn === 'min') resultVal = Math.min(...values);
          else if (fn === 'max') resultVal = Math.max(...values);
        }

        aggregatedResult.push({
          ...meta,
          [targetColumn || `${aggregateColumn}_${fn}`]: resultVal,
        });
      });

      return aggregatedResult;
    }

    default:
      return rows;
  }
}

/**
 * Process a sequence of transformations on row data
 * @param {Array<Object>} rows 
 * @param {Array<Object>} transformations - list of { type, config }
 * @returns {Array<Object>}
 */
function executeTransformations(rows, transformations = []) {
  let currentRows = rows.map((r) => ({ ...r }));

  for (const trans of transformations) {
    const valResult = validateTransformationConfig(trans.type, trans.config);
    if (!valResult.valid) {
      throw new Error(`Transformation validation error (${trans.type}): ${valResult.message}`);
    }
    currentRows = applySingleTransformation(currentRows, trans);
  }

  return currentRows;
}

module.exports = {
  validateTransformationConfig,
  applySingleTransformation,
  executeTransformations,
};
