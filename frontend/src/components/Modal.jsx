import { useState } from 'react';

export default function Modal({ title, onClose, onSubmit, fields }) {
  const [values, setValues] = useState(() => {
    const init = {};
    fields.forEach((f) => { init[f.name] = f.defaultValue || ''; });
    return init;
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(values);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <form onSubmit={handleSubmit}>
          {fields.map((f) => (
            <div className="form-group" key={f.name}>
              <label>{f.label}</label>
              {f.type === 'select' ? (
                <select
                  value={values[f.name]}
                  onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                  required={f.required}
                >
                  <option value="">Select...</option>
                  {(f.options || []).map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={f.type || 'text'}
                  value={values[f.name]}
                  onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                  placeholder={f.placeholder}
                  required={f.required}
                />
              )}
            </div>
          ))}
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-submit">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}
