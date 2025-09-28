
  // Attach the event listener after the DOM is fully loaded
  // alert('hi')
  function updateAmount(form) {
  if (!form || form.tagName.toLowerCase() !== 'form') {
    console.warn("❌ Provided element is not a valid form.");
    return;
  }
  // console.log(form)
  const tableBody = form.querySelector("#ItemDataTable");


  if (!tableBody) {
    // console.warn("⚠️ No #ItemDataTable found inside the form.");
    return;
  }

  // Add only once
  if (!tableBody.dataset.listenerAttached) {
    tableBody.dataset.listenerAttached = "true"; // Prevent duplicate listeners

    tableBody.addEventListener("input", function (event) {
      const target = event.target;

      // Only proceed if the change is in rate or quantity
      if (target.classList.contains("rate") || target.classList.contains("quantity")) {
        const row = target.closest("tr");
        if (!row) return;

        const rateInput = row.querySelector(".rate");
        const qtyInput = row.querySelector(".quantity");
        const amountInput = row.querySelector(".amount");

        if (!rateInput || !qtyInput || !amountInput) return;

        const rate = parseFloat(rateInput.value.replace(/,/g, '')) || 0;
        const qty = parseFloat(qtyInput.value.replace(/,/g, '')) || 0;

        const amount = rate * qty;

        amountInput.value = formatNumberIndianForForm(amount);
        updateTotal(form); // Update total after recalculation
      }
    });
  }
}

function updateTotal(form) {
  if (!form || form.tagName.toLowerCase() !== 'form') {
    console.warn("❌ Provided element is not a valid form.");
    return;
  }
  console.log(form)
  let total = 0;

  form.querySelectorAll(".amount").forEach(input => {
    const raw = input.value || input.textContent || "0";
    const cleanValue = raw.toString().replace(/,/g, '');
    const number = parseFloat(cleanValue);
    if (!isNaN(number) && number > 0) {
      total += number;
    }
  });

  const totalDisplay = form.querySelector("#totalAmountsales");
   if (totalDisplay) {
    totalDisplay.textContent = formatNumberIndianForForm(total);
  } else {
    console.warn(form,"❌ No #totalAmountsales element found inside this form.");
  }

  // ✅ Update GST summary
  generateGSTSummaryTable(form);
}

function updateSerials(form) {
  const table = form.querySelector("table");
  if (!table) return;

  // Check if the table contains any cell with text "gst" (case-insensitive)
  const hasGst = Array.from(table.querySelectorAll("td, th"))
    .some(cell => cell.textContent.toLowerCase().includes("gst"));

  if (hasGst) return; // Don't update serials if "gst" is found

  const rows = table.querySelectorAll("tbody tr");
  rows.forEach((row, index) => {
    const srNoCell = row.querySelector(".sr-no");
    if (srNoCell) srNoCell.textContent = index + 1;
  });
}


document.querySelectorAll("form").forEach(form => {
  const addBtn = form.querySelector(".add-row-button");
  if (addBtn) {
    addBtn.addEventListener("click", () => {
      addRowToFormTable(form);
    });
  }
});

document.addEventListener("click", function (event) {
  // ✅ Only run when a delete button is clicked
  if (!event.target.classList.contains("delete-row-button")) return;

  const form = event.target.closest("form");
  const row  = event.target.closest("tr");
  if (!form || !row) return;

  const tableBody = form.querySelector(".form-table-body, table tbody");
  if (!tableBody) return console.error("❌ No table body found inside form", form);

  const formCode = form.dataset.formCode || "(no code)";
  console.log(`🗑️ Delete clicked in form [${formCode}]`);

  // ✅ Enforce at least one row remains
  if (tableBody.rows.length > 1) {
    row.remove();
    updateSerials(form);
  } else {
    // alert("⚠️ At least one row must remain in this form.");
    errorNotificationHandler("error", "At least one row must remain in this form.")
  }
});

function addRowToFormTable(form) {
  if (!form) return console.error("❌ No form passed");
  const tableBody = form.querySelector("table tbody");
  if (!tableBody) return console.error("❌ No <tbody> found inside the form.");

  const formCode = form.dataset.formCode || "(no code)";
  console.log(`➕ Adding row to form [${formCode}] , ${form.id}`);


  let offsetting;
  if(form.id === "Receiptform" ){
    offsetting = "Credit Account"
  } else {
    offsetting = "Debit Account"
  }
  // ----- Special case: Receipt/Payment -----
  if (form.classList.contains("receiptpayment")) {
    const rowCount = tableBody.querySelectorAll("tr").length + 1;
    const firstInput = tableBody.querySelector("tr:first-child td input[list]");
    const listId = firstInput ? firstInput.getAttribute("list") : "";

    const newRow = document.createElement("tr");
    newRow.className = "credit-entry-row";
    newRow.innerHTML = `
      <td class="sr-no">${rowCount}</td>
      <td><input type="text" class="form-control" ${listId ? `list="${listId}"` : ""} name="${offsetting}"></td>
      <td><input type="number" class="form-control amount" name="Amount" step="0.01" style="text-align: right;"></td>
      <td><input type="text" class="form-control" name="Description" autocomplete="on"></td>
      <td><button type="button" class="btn btn-primary delete-row-button">Delete</button></td>
    `;
    tableBody.appendChild(newRow);
    updateSerials(form);
    return;
  }

  // ----- General case -----
  const firstRow = tableBody.querySelector("tr");
  if (!firstRow) return console.error("❌ No first row to copy from.");
  const rowCount = tableBody.querySelectorAll("tr").length + 1;

  const newRow = document.createElement("tr");
  newRow.className = "credit-entry-row";

  const cells = [];
  cells.push(`<td class="sr-no">${rowCount}</td>`);

  const originalInputs = firstRow.querySelectorAll("input:not([type=hidden])");
  originalInputs.forEach(input => {
    let attrs = Array.from(input.attributes)
      .map(attr => `${attr.name}="${attr.value}"`)
      .join(" ");

    // Make sure we keep the original datalist if present
    const listAttr = input.getAttribute("list");
    if (listAttr) attrs = attrs.replace(/list=".*?"/, `list="${listAttr}"`);

    cells.push(`<td><input ${attrs}></td>`);
  });

  const hiddenInputs = firstRow.querySelectorAll("input[type='hidden']");
  hiddenInputs.forEach(input => {
    const attrs = Array.from(input.attributes)
      .map(attr => `${attr.name}="${attr.value}"`)
      .join(" ");
    cells.push(`<input ${attrs}>`);
  });

  cells.push(`<td><button type="button" class="btn btn-primary delete-row-button">Delete</button></td>`);

  newRow.innerHTML = cells.join("\n");
  tableBody.appendChild(newRow);
  updateSerials(form);
}




document.querySelectorAll('.table input[type="number"]').forEach(input => {
      input.style.textAlign = "right";
    });

// Universal input tracker for all forms on the page
document.addEventListener("input", (event) => {
  const input = event.target;
  const form = input.closest("form");

  if (!form) return; // Ignore inputs not inside a form

  // Log the input and its parent form
  // console.log("📝 Input changed in form:", form);
  // console.log("➡️ Field name:", input.name || input.className);
  // console.log("➡️ New value:", input.value);

  // ✅ Call your update logic here
  // updateTotal(form);
  updateAmount(form);
  // updateSerials(form)
  
});

  
document.querySelectorAll("form").forEach(form => {
  updateSerials(form);
});

function clearTaxSummaryIDIfExists(form) {
  if(form.classList.contains("receiptpayment")){
    return
  }


  if (!form || form.tagName.toLowerCase() !== 'form') {
    console.warn("❌ Provided element is not a valid form.");
    return;
  }

  const summaryDiv = form.querySelector('#tax-summary-working');
  if (summaryDiv) {
    summaryDiv.innerHTML = ''; // Clear the ID
    console.log("✅ Cleared #tax-summary-working ID in form.");
  } else {
    console.log("ℹ️ No #tax-summary-working div found in form.");
  }
}













const scriptURL = 'https://script.google.com/macros/s/AKfycbx96nZGc4TXpyyYDJ2Dvxbqjfp7YLAEff6CzD0DTR9mw8GQeXpVeQPkoNMJ--6EiI53/exec';

document.addEventListener('change', function(event) {
  if (event.target.matches('.itemName')) {
    const input = event.target;
    const identifier = "UID_" + Math.floor(Math.random()*50000)
    input.dataset.identifier = identifier;
    const itemName = input.value.trim();
    const row = input.closest('tr');
    showLoaderOnInput(input)
    // console.log("inputsee:",input)

    if (!itemName) return;

    console.log('Item Selected:', itemName);
    console.log('Row Element:', row);

    // Store row reference for callback use
    ItemRowInputHandler._currentRow = row;

    const sheetName = userId + "_Stock"; // Assuming userId is globally defined
    const columnNameji = input.dataset.column_name_add || 'itemName';
    const callbackName = 'ItemRowInputHandler';

    // Remove existing script if any
    const oldScript = document.getElementById('jsonp-script');
    if (oldScript) oldScript.remove();

    // Create JSONP script call
    const script = document.createElement('script');
    script.id = 'jsonp-script';
    script.src = `${scriptURL}?action=getRowData&sheet_name=${sheetName}&column_to_search=${columnNameji}&document_number=${encodeURIComponent(itemName)}&callback=${callbackName}&unique_code=${identifier}`;
    document.body.appendChild(script);

    console.log('JSONP Request Sent:', script.src);
  }
});

function ItemRowInputHandler(data) {
  // console.group("🔍 ItemRowInputHandler Debug");
  console.log('📦 Full Server Response:', data);

  if (!data || data.status !== 'success' || !Array.isArray(data.matching_rows) || data.matching_rows.length === 0) {
    console.warn('❌ Invalid or empty response from server.');
    // console.groupEnd();
    return;
  }
  const item = data.matching_rows[0];
  const serverIdentifier = data.identify;
  console.log('✅ Server Provided Identifier:', serverIdentifier);
  console.log('⚠️ Item Object\'s unique_code (may be wrong):', item.unique_code);

  const matchingInput = document.querySelector(`.table .itemName[data-identifier="${serverIdentifier}"]`);
  if (!matchingInput) { 
    console.warn('❌ No input found with identifier:', serverIdentifier);
    errorNotificationHandler("error", `No input found with identifier:, ${serverIdentifier}`)
    // console.groupEnd();
    return;
  }
  removeLoaderFromInput(matchingInput)


  const row = matchingInput.closest('tr');
  const form = row.closest('form')
  if (!row) {
    console.warn('❌ No table row found for matching input');
    errorNotificationHandler("error", "No table row found for matching input")
    console.groupEnd();
    return;
  }

  console.log('🆗 Matched Table Row:', row);

  const fieldMap = {
    "ItemDocumentNumber": "Document Number",
    "Description": "Description",
    "ItemUnit": "ItemUnit",
    "itemGroup": "itemGroup",
    "ItemTax": "ItemTax",
    "ItemCode": "Stock Code",
    "itemHSN": "itemHSN",
    // "Rate": "Rate"
  };

  // console.group("🛠️ Field Update Debugging");
  Object.entries(fieldMap).forEach(([inputName, itemKey]) => {
    const inputEl = row.querySelector(`input[name="${inputName}"]`);
    if (inputEl) {
      const oldValue = inputEl.value;
      const newValue = item[itemKey] || '';
      inputEl.value = newValue;
      // console.log(`✅ [${inputName}] Updated: "${oldValue}" → "${newValue}"`);
    } else {
      console.warn(`⚠️ Missing input element: input[name="${inputName}"]`);
    }
  });
  // console.groupEnd();

  // console.log('✅ Final updated row values:', {
  //   ItemDocumentNumber: row.querySelector('input[name="ItemDocumentNumber"]')?.value,
  //   Description: row.querySelector('input[name="Description"]')?.value,
  //   ItemUnit: row.querySelector('input[name="ItemUnit"]')?.value,
  //   itemGroup: row.querySelector('input[name="itemGroup"]')?.value,
  //   ItemTax: row.querySelector('input[name="ItemTax"]')?.value,
  //   itemHSN: row.querySelector('input[name="itemHSN"]')?.value,
  //   Rate: row.querySelector('input[name="Rate"]')?.value
  // });

  // ✅ Remove the data-identifier after success
  matchingInput.removeAttribute('data-identifier');
  // console.log(`🧹 Removed data-identifier from input`, matchingInput);

  console.groupEnd(); // End Debug
  generateGSTSummaryTable(form);

}


function generateGSTSummaryTable(form) {
  if (!form || form.tagName.toLowerCase() !== 'form') {
    console.warn("❌ Provided element is not a valid form.");
    return;
  }

  if(form.classList.contains("receiptpayment")){
    return
  }

  const rows = form.querySelectorAll('table tbody tr');
  const taxSummary = {};

  rows.forEach(row => {
    const docInput = row.querySelector('input[name="ItemDocumentNumber"]');
    const amountInput = row.querySelector('input[name="amount"], .amount');
    const taxRateInput = row.querySelector('input[name="ItemTax"]');

    if (!docInput || !docInput.value.trim()) return;
    if (!amountInput || !(amountInput.value || amountInput.textContent)) return;

    const rawAmount = amountInput.value || amountInput.textContent || '0';
    const cleanAmount = rawAmount.toString().replace(/,/g, '');
    const amount = parseFloat(cleanAmount);

    if (isNaN(amount) || amount <= 0) return; // ⛔ Ignore non-numeric or 0 amounts

    const taxRate = parseFloat(taxRateInput?.value) || 0;

    if (!taxSummary[taxRate]) {
      taxSummary[taxRate] = 0;
    }
    taxSummary[taxRate] += amount;
  });

  const summaryContainer = form.querySelector('#tax-summary-working');
  if (!summaryContainer) {
    console.warn("⚠️ No #tax-summary-working div found in form.");
    return;
  }

  summaryContainer.innerHTML = ''; // Clear old summary

  const table = document.createElement('table');
  table.className = 'table tax-summary';
  table.innerHTML = `
    <tr>
      <td><strong>Tax Rate (%)</strong></td>
      <td><strong>Amount</strong></td>
      <td><strong>CGST</strong></td>
      <td><strong>SGST</strong></td>
      <td><strong>IGST</strong></td>
      <td><strong>Invoice Total</strong></td>
    </tr>
  `;

  let totalAmount = 0, totalCGST = 0, totalSGST = 0, totalIGST = 0;

  for (const [rate, amount] of Object.entries(taxSummary)) {
    const taxRate = parseFloat(rate);
    const cgst = (taxRate / 2) * amount / 100;
    const sgst = (taxRate / 2) * amount / 100;
    const igst = 0; // Modify if IGST applies
    const invoiceAmount = amount + cgst + sgst + igst;

    totalAmount += amount;
    totalCGST += cgst;
    totalSGST += sgst;
    totalIGST += igst;

    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${taxRate.toFixed(2)}%</td>
      <td>${formatNumberIndianForForm(amount)}</td>
      <td>${formatNumberIndianForForm(cgst)}</td>
      <td>${formatNumberIndianForForm(sgst)}</td>
      <td>${formatNumberIndianForForm(igst)}</td>
      <td>${formatNumberIndianForForm(invoiceAmount)}</td>
    `;
    table.appendChild(row);
  }

  const grandTotal = totalAmount + totalCGST + totalSGST + totalIGST;

  const totalRow = document.createElement('tr');
  totalRow.style.fontWeight = "bold";
  totalRow.innerHTML = `
    <td>Total</td>
    <td>${formatNumberIndianForForm(totalAmount)}</td>
    <td>${formatNumberIndianForForm(totalCGST)}</td>
    <td>${formatNumberIndianForForm(totalSGST)}</td>
    <td>${formatNumberIndianForForm(totalIGST)}</td>
    <td>${formatNumberIndianForForm(grandTotal)}</td>
  `;
  table.appendChild(totalRow);

  summaryContainer.appendChild(table);
}


function formatNumberIndianForForm(num, decimals = 2) {
  const number = parseFloat(String(num).replace(/,/g, ''));

  if (isNaN(number)) return '';

  return number.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}



function showLoaderOnInput(input) {
  // input.disabled = true;
  input.style.outline = "1px solid orange";
  input.style.transition = "opacity 1s ease";

  input.blur();

  // Create loader element
  const loader = document.createElement("span");
  loader.className = "input-loader";
  loader.style.position = "absolute";
  loader.style.width = "16px";
  loader.style.height = "16px";
  loader.style.border = "2px solid #f3f3f3";
  loader.style.borderTop = "2px solid orange";
  loader.style.borderRadius = "50%";
  loader.style.animation = "spin 1s linear infinite";
  loader.style.opacity = "0";
  loader.style.transition = "opacity 1s ease";
  loader.style.pointerEvents = "none";

  // Position relative to input
  const rect = input.getBoundingClientRect();
  loader.style.position = "fixed";
  loader.style.top = rect.top + window.scrollY + input.offsetHeight / 2 - 8 + "px";
  loader.style.left = rect.right - 20 + "px";

  // Add keyframes once
  if (!document.getElementById("spin-keyframes")) {
    const style = document.createElement("style");
    style.id = "spin-keyframes";
    style.innerHTML = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(loader);

  // Trigger fade-in
  requestAnimationFrame(() => {
    loader.style.opacity = "1";
  });

  // Store loader reference
  input._loader = loader;
}

function removeLoaderFromInput(input) {
  input.disabled = false;
  input.style.outline = "";
  input.style.transition = "opacity 1s ease";


  const loader = input._loader;
  if (loader) {
    loader.style.opacity = "0";
    setTimeout(() => {
      if (loader && loader.parentNode) {
        loader.parentNode.removeChild(loader);
        input._loader = null;
      }
    }, 1000); // matches the fade-out duration
  }
}

