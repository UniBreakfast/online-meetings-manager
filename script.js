const html = String.raw, css = String.raw;
const assign = (obj, props) => {
  for (const [key, value] of Object.entries(props)) {
    if (value instanceof Object) assign(obj[key], value);
    else obj[key] = value;
  }
  return obj;
}
const create = (tag, props) => assign(document.createElement(tag), props);
const markUpOptions = values => values.mapJoin(value => html`<option value="${value}"></option>`);

Array.prototype.mapJoin = function (cb) { return this.map(cb).join('') };
Event.prototype.skip = Event.prototype.preventDefault;
Element.prototype.qrOne = Element.prototype.querySelector;
Element.prototype.qrAll = Element.prototype.querySelectorAll;

const tags = ['Lesson', 'Group lesson', 'N-code', 'Beetroot Academy'];
const attendees = ['Alice', 'Bob', 'Charlie'];
const locations = ['Zoom Pair Pro room', 'Zoom BA Veteran room', 'Meet room'];

const style = create('style', {
  textContent: css`
    * { box-sizing: border-box }
    body { text-align: center;  font-family: 'Trebuchet MS' }

    button { cursor: pointer }

    form { display: grid;  gap: 10px;

      >:first-child { margin: 0 }
      
      label { display: grid;  gap: 1px;  flex: 1;

        >span { font-size: small }
        input { width: 100%;  text-align: center }
        >div { display: flex;  gap: 5px }
      }

      >div { display: flex;  gap: 10px }
      
      .chips { flex-wrap: wrap;  gap: 5px;  align-items: flex-start;

        >:last-child { margin-bottom: 5px }
        >button { pointer-events: none; 

          >b { pointer-events: all;  padding: 3px 6px;  margin: 0 -6px 0 -2px }
        }
      }

  
      .buttons { display: flex;  gap: 10px;  justify-content: center }
    }
  `,
});

const newMeetingBtn = create('button', {
  value: 'new-meeting',
  textContent: 'New Meeting',
});

const newMeetingDialog = create('dialog', {
  id: 'new-meeting',
  innerHTML: html`
    <form method="dialog">
      <h2>Create New Meeting</h2>

      <label>
        <span>Tags:</span>

        <div style="order: 2">
          <datalist id="tags"></datalist>
          <input type="text" name="tags" list="tags">
          <button value="clear-chips" data-name="tags" style="order: -1">×</button>
          <button value="add-chip" data-name="tags">Add</button>
        </div>
        
        <div class="chips" data-name="tags"></div>
      </label>
      
      <label>
        <span>Label:</span>
        <input type="text" name="label">
      </label>

      <label>
        <span>Expected attendees:</span>

        <div style="order: 2">
          <datalist id="attendees"></datalist>
          <input type="text" name="attendees" list="attendees">
          <button value="clear-chips" data-name="attendees" style="order: -1">×</button>
          <button value="add-chip" data-name="attendees">Add</button>
        </div>

        <div class="chips" data-name="attendees"></div>
      </label>

      <label>
        <span>Date:</span>
        <input type="date" name="date">
      </label>

      <div>
        <label>
          <span>Start time:</span>
          <input type="time" name="time">
        </label>
  
        <label>
          <span>End time:</span>
          <input type="time" name="time">
        </label>
      </div>

      <label>
        <span>Location:</span>
        <datalist id="locations"></datalist>
        <input type="text" name="location" list="locations">
      </label>

      <label>
        <span>Notes:</span>
        <textarea name="notes" 
          style="min-width: 100%;  max-width: 80vw;  min-height: 30px;  max-height: 50dvh"
        ></textarea>
      </label>

      <div class="buttons">
        <button value="create-meeting">Create</button>
        <button value="clear">Clear</button>
        <button value="cancel">Cancel</button>
      </div>
    </form>
  `,
});

const newMeetingForm = newMeetingDialog.firstElementChild;
const tagsDatalist = newMeetingForm.qrOne('#tags');
const attendeesDatalist = newMeetingForm.qrOne('#attendees');
const locationsDatalist = newMeetingForm.qrOne('#locations');
const [newMeetingTags, newMeetingAttendees] = newMeetingForm.qrAll('.chips');

const elements = {
  style,
  buttons: { newMeeting: newMeetingBtn },
  dialogs: { newMeeting: newMeetingDialog },
  forms: { newMeeting: newMeetingForm },
  datalists: {
    tags: tagsDatalist,
    attendees: attendeesDatalist,
    locations: locationsDatalist,
  },
  chips: {
    tags: newMeetingTags,
    attendees: newMeetingAttendees,
  },
};

const ui = {
  show: {
    newMeetingForm: showNewMeetingForm,
  },
  chips: {
    tags: {
      add: v => addChip('tags', v),
      remove: v => removeChip('tags', v),
      clear: v => clearChips('tags'),
    },
    attendees: {
      add: v => addChip('attendees', v),
      remove: v => removeChip('attendees', v),
      clear: v => clearChips('attendees'),
    },
  },
  datalists: {
    tags: {
      hide: v => toggleChipOption('tags', v, false),
      show: v => toggleChipOption('tags', v, true),
    },
    attendees: {
      hide: v => toggleChipOption('attendees', v, false),
      show: v => toggleChipOption('attendees', v, true),
    },
  },
};

const handlers = {
  submit: {
    newMeeting: handleNewMeeting,
  },
  click: {
    backdrop: handleClickOut,
  },
};

document.head.append(elements.style);
document.body.append(elements.buttons.newMeeting, elements.dialogs.newMeeting);

window.onclick = handlers.click.backdrop;
elements.buttons.newMeeting.onclick = ui.show.newMeetingForm;
elements.forms.newMeeting.onsubmit = handlers.submit.newMeeting;

function showNewMeetingForm() {
  elements.forms.newMeeting.reset();
  elements.chips.tags.innerHTML = '';
  elements.chips.attendees.innerHTML = '';
  elements.datalists.tags.innerHTML = markUpOptions(tags);
  elements.datalists.attendees.innerHTML = markUpOptions(attendees);
  elements.datalists.locations.innerHTML = markUpOptions(locations);
  elements.dialogs.newMeeting.showModal();
}

function handleNewMeeting(e) {
  const form = e.target;
  const btn = e.submitter;

  if (btn.value === 'remove-chip') {
    e.skip();

    const container = btn.parentElement;
    const { value } = btn.dataset;
    const { name } = container.dataset;

    ui.chips[name].remove(value);
    ui.datalists[name].show(value);
    
  } else if (btn.value === 'clear-chips') {
    e.skip();

    const { name } = btn.dataset;
    
    ui.chips[name].clear();

  } else if (btn.value === 'add-chip') {
    e.skip();

    const { name } = btn.dataset;
    const { value } = form[name]

    form[name].value = '';
    ui.chips[name].add(value);
    ui.datalists[name].hide(value);

  } else if (btn.value === 'clear') {
    e.skip();
    
    showNewMeetingForm();
  }
}

function handleClickOut(e) {
  if (e.target.localName !== 'dialog') return;

  const dialog = e.target;
  const x = e.clientX;
  const y = e.clientY;
  const rect = dialog.getBoundingClientRect();
  
  if (!isInside({x, y}, rect)) dialog.close();
}

function isInside({x, y}, {top, right, bottom, left}) {
  return x >= left && x <= right && y >= top && y <= bottom;
}

function addChip(name, value) {
  const selector = `[data-value="${value}"]`;

  if (elements.chips[name].qrOne(selector)) return;
  
  const chip = create('button', {
    value: 'remove-chip',
    innerHTML: `${value} <b>×</b>`,
    dataset: { name, value },
  });

  elements.chips[name].append(chip);
}

function removeChip(name, value) {
  const selector = `[value="remove-chip"][data-value="${value}"]`;
  const chip = elements.chips[name].qrOne(selector);

  chip.remove();
}

function clearChips(name) {
  elements.chips[name].innerHTML = '';
}

function toggleChipOption(name, value, on) {
  const selector = `[value="${value}"]`;
  const option = elements.datalists[name].qrOne(selector);

  if (option) assign(option, { disabled: !on, hidden: !on });
}
