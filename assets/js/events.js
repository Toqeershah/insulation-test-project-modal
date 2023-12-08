
import * as bootstrap from "bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";

import data from "./ProjectData.json";

class FormHandler {
  tabsAttached = false;
  addNewBuswaySelector = "#addNewBuswayBtn";
  buswayModalSelector = "#buswayModal";
  selectedBuswaysTableSelector = "#selectedBusways";
  buswayModal = null;
  selectedBusways = [];

  constructor(data) {
    this.formData = data;
    this.setInitialFieldOptions();
    this.renderInitialFieldsOptions();
    this.clearBuswayNos();
    const newBuswayBtn = document.querySelector(this.addNewBuswaySelector);
    newBuswayBtn.addEventListener("click", this.handleAddNewBusways);
  }

  getStoredBuswayNos() {
    const buswayNos = localStorage.getItem("busway-nos");

    if (!buswayNos) return null;

    return JSON.parse(buswayNos);
  }

  clearBuswayNos() {
    localStorage.removeItem("busway-nos");
  }

  storeStoredBuswayNo(no) {
    const currentBuswayNos = this.getStoredBuswayNos() || [];
    if (currentBuswayNos.includes(no)) return;
    currentBuswayNos.push(no);

    localStorage.setItem("busway-nos", JSON.stringify(currentBuswayNos));
  }

  setInitialFieldOptions() {
    this.initialFields = this.initialFields.map((field) => {
      field.options = this.formData[field.selector];
      return field;
    });
  }

  renderInitialFieldsOptions() {
    this.initialFields.forEach((field) => {
      const inputField = document.querySelector(`#${field.selector}`);

      field.options.forEach((option) => {
        const optionElement = this.createOptionElement(option, option);
        inputField.append(optionElement);
      });

      inputField.addEventListener("change", this.handleInitialFieldChange);
    });
  }

  handleInitialFieldChange = (e) => {
    const selector = e.target.id;
    const fieldIndex = this.initialFields.findIndex(
      (field) => field.selector === selector
    );

    const changedField = this.initialFields[fieldIndex];
    const fieldOrder = changedField?.order;

    this.invalidDependentFields(fieldOrder);
    this.enableNextInitialField(fieldOrder);

    changedField.currentValue = e.target.value;

    this.showHideAdditionalFields();
  };

  invalidDependentFields(order) {
    this.initialFields.forEach((field) => {
      if (field.order <= order) return;
      const fieldElement = document.querySelector(`#${field.selector}`);
      fieldElement.value = "";
      fieldElement.disabled = true;
      field.currentValue = "";
    });
  }

  enableNextInitialField(order) {
    const field = this.initialFields.find((field) => field.order === order + 1);

    if (!field) return;

    const inputField = document.querySelector(`#${field.selector}`);
    inputField.disabled = false;
  }

  showHideAdditionalFields() {
    const isValid = this.initialFields.every(
      (field) => field.currentValue !== ""
    );
    const tabs = document.querySelector("#tabs-selector");
    const tabContent = document.querySelector("#tabContent");

    if (!isValid) {
      tabs.classList.add("d-none");
      tabContent.classList.add("d-none");
      return;
    }

    this.renderAdditionalFields();
    tabs.classList.remove("d-none");
    tabContent.classList.remove("d-none");
  }

  renderAdditionalFields = (e) => {
    const tabSelector = document.querySelector("#tabs-selector");
    const tabs = tabSelector.querySelectorAll("button");
    const selectedBuswaysTable = document.querySelector(
      this.selectedBuswaysTableSelector
    );

    tabs.forEach((tab) => {
      const tabContent = document.querySelector(`#tab-${tab.id}`);
      tabContent.innerHTML = "";

      if (tab.ariaSelected === "true" || e?.target) {
        const selector = e?.target ? e.target.id : tab.id;
        const activeTabSelector = `#tab-${selector}`;
        const tabFields = this.tabSelectorFields[selector];
        const tabContent = document.querySelector(activeTabSelector);
        tabContent.innerHTML = "";

        tabFields?.forEach((field) => {
          const value = this.formData[field.selector] || field.value;
          const inputField = this.createInputElement(
            field.type,
            value,
            field.text,
            field.selector
          );

          tabContent.append(inputField);
        });
        this.addBuswayModalTrigger(activeTabSelector);
        this.clearSelectedBuswayTable();

        if (
          (tab.id === "insulationTest" && !e) ||
          (e && e.target.id === "insulationTest")
        ) {
          console.log(tab.id, tab.ariaSelected);
          this.renderSelectedBuswasyForInsulationTest();
        }
      }

      if (!this.tabsAttached)
        tab.addEventListener("show.bs.tab", this.renderAdditionalFields);
    });
    this.tabsAttached = true;
  };

  addBuswayModalTrigger(selector) {
    const buttonContainer = document.createElement("div");
    const button = document.createElement("button");

    buttonContainer.className = "col-12 mt-5 d-flex";
    buttonContainer.style = "width: 100%;";

    button.type = "button";
    button.className = "btn btn-dark";
    button.style = "margin-left: auto";
    button.innerText = "Add Busway";
    button.addEventListener("click", () => {
      const buswayModal = new bootstrap.Modal(this.buswayModalSelector, {
        keyboard: false,
      });
      this.buswayModal = buswayModal;
      const newBuswayBtn = document.querySelector(this.addNewBuswaySelector);
      this.renderBuswayModalOptions();
      newBuswayBtn.disabled = true;
      buswayModal.show();
    });

    buttonContainer.append(button);

    const activeTab = document.querySelector(selector);
    activeTab.append(buttonContainer);
  }

  renderBuswayModalOptions = () => {
    const busways = this.formData.busways;
    const buswayModal = document.querySelector(this.buswayModalSelector);
    const buswayModalTableBody = buswayModal.querySelector("table tbody");

    const storedBusways = this.getStoredBuswayNos() || [];

    buswayModalTableBody.innerHTML = "";

    const activeTab = document.querySelector("#tabs-selector .active");
    busways?.forEach((busway) => {
      if (storedBusways.includes(activeTab?.id + "-" + busway.no)) return;

      const option = this.createBuswayOption(busway);
      buswayModalTableBody.append(option);
    });
  };

  enableAddNewBuswayBtn() {
    const newBuswayBtn = document.querySelector(this.addNewBuswaySelector);
    if (this.selectedBusways.length === 0) newBuswayBtn.disabled = true;
    else newBuswayBtn.disabled = false;
  }

  handleAddNewBusways = (e) => {
    if (this.selectedBusways.length > 0) {
      this.selectedBusways.forEach((buswayNo) => {
        this.storeStoredBuswayNo(buswayNo);
      });
      this.selectedBusways = [];
    }

    const activeTab = document.querySelector("#tabs-selector .active");
    this.clearSelectedBuswayTable();
    if (activeTab.id === "insulationTest")
      this.renderSelectedBuswasyForInsulationTest();
    if (this.buswayModal) this.buswayModal.hide();
  };

  handleBuswayOptionCheck = (e) => {
    const buswayNo = e.target.id;
    if (e.target?.checked) {
      if (!this.selectedBusways.includes(buswayNo))
        this.selectedBusways.push(buswayNo);
    } else {
      const buswayIndex = this.selectedBusways.indexOf(buswayNo);
      if (buswayIndex !== -1)
        this.selectedBusways = this.selectedBusways.filter(
          (no) => no !== buswayNo
        );
    }
    this.enableAddNewBuswayBtn();
  };

  createBuswayOption(busway) {
    const trElement = document.createElement("tr");
    const checkBuswayContainerElement = document.createElement("td");
    const checkBuswayElement = document.createElement("input");
    const activeTab = document.querySelector("#tabs-selector .active");

    checkBuswayElement.type = "checkbox";
    checkBuswayElement.id = activeTab?.id + "-" + busway?.no;
    checkBuswayElement.className = "form-check-input";
    checkBuswayElement.addEventListener("change", this.handleBuswayOptionCheck);

    checkBuswayContainerElement.appendChild(checkBuswayElement);

    trElement.appendChild(checkBuswayContainerElement);

    Object.entries(busway).forEach(([key, value]) => {
      const tdElement = document.createElement("td");
      tdElement.innerText = value;
      trElement.append(tdElement);
    });

    return trElement;
  }

  renderSelectedBuswasyForInsulationTest() {
    const selectedBuswayNos = this.getStoredBuswayNos() || [];
    if (selectedBuswayNos.length === 0) return;
    const selectedBuswayNosForInsulationTest = selectedBuswayNos.filter(
      (buswayNo) => buswayNo.startsWith("insulationTest")
    );
    const selectedBusways = this.formData.busways.filter((busway) =>
      selectedBuswayNosForInsulationTest.includes("insulationTest-" + busway.no)
    );

    if (selectedBusways.length === 0) return;
    const selectedBuswaysTable = document.querySelector(
      this.selectedBuswaysTableSelector
    );

    selectedBusways.forEach((busway, i) => {
      this.renderSelectedBuswayRowForInsulationTest(busway.no, i + 1);
    });

    this.renderSelectedBuswayHeaderForInsulationTest();
  }

  clearSelectedBuswayTable() {
    const selectedBuswaysTable = document.querySelector(
      this.selectedBuswaysTableSelector
    );
    selectedBuswaysTable.querySelector("thead").innerHTML = "";
    selectedBuswaysTable.querySelector("tbody").innerHTML = "";
  }

  handleDeleteBusway = (e) => {
    const selectedBusways = this.getStoredBuswayNos() || [];

    if (selectedBusways.length === 0) return;
    const toDeleteId = e.target.matches("button")
      ? e.target.dataset?.deleteNo
      : e.target.closest("button").dataset?.deleteNo;

    const updatedBusways = selectedBusways.filter(
      (busway) => busway !== toDeleteId
    );
    console.log(updatedBusways, selectedBusways, e);

    this.clearBuswayNos();
    updatedBusways.forEach((buswayNo) => {
      this.storeStoredBuswayNo(buswayNo);
    });

    const activeTab = document.querySelector("#tabs-selector .active");
    if (activeTab.id === "insulationTest") {
      this.clearSelectedBuswayTable();
      this.renderSelectedBuswasyForInsulationTest();
    }
  };

  renderSelectedBuswayRowForInsulationTest(no, index) {
    const trElement = document.createElement("tr");
    const selectedBuswaysTableBody = document.querySelector(
      `${this.selectedBuswaysTableSelector} tbody`
    );

    const columns = [
      { type: "text", text: index },
      { type: "text", text: no },
      { type: "switch" },
      { type: "switch" },
      { type: "switch" },
      { type: "switch" },
      { type: "switch" },
      { type: "action" },
    ];

    columns.forEach((column) => {
      const tdElement = document.createElement("td");
      if (column.type === "text") tdElement.innerText = column.text;

      if (column.type === "action") {
        const button = document.createElement("button");
        const i = document.createElement("i");

        button.className = "button";
        button.type = "button";
        button.dataset.deleteNo = "insulationTest-" + no;
        button.addEventListener("click", this.handleDeleteBusway);
        i.className = "bi bi-trash";

        button.append(i);
        tdElement.appendChild(button);
      }

      if (column.type === "switch") {
        const checkbox = document.createElement("input");
        const div = document.createElement("div");

        checkbox.className = "form-check-input";
        checkbox.type = "checkbox";
        checkbox.role = "switch";
        div.className = "d-flex gap-2";

        div.append("Passed");
        div.append(checkbox);
        div.append("Flash Over");
        tdElement.appendChild(div);
      }

      trElement.appendChild(tdElement);
    });

    selectedBuswaysTableBody.append(trElement);
  }

  renderSelectedBuswayHeaderForInsulationTest() {
    const sequence = this.initialFields.find(
      (field) => field.selector === "project-sequence"
    )?.currentValue;
    if (!sequence) return;

    const selectedBuswaysTableHeader = document.querySelector(
      `${this.selectedBuswaysTableSelector} thead`
    );
    const trElement = document.createElement("tr");
    const headersStart = sequence.split("").map((letter, i) => {
      return `${letter} - ${
        sequence.substring(0, i) + sequence.substring(i + 1)
      }`;
    });

    const headersLastLetters = `${sequence[0]}/L1/L2/L3/${
      sequence[sequence.length - 1]
    }`.split("/");
    const headersEnd = headersLastLetters.map((letter, i) => {
      return `(${letter} - ${
        headersLastLetters.slice(0, i) + headersLastLetters.slice(i + 1)
      })`.replace(/,/g, "/");
    });

    const headers = [
      "Item",
      "Busduct Serial No.",
      ...headersStart.map((word, i) => word + " " + headersEnd[i]),
      "Action",
    ];

    headers.forEach((header) => {
      const thElement = document.createElement("th");
      thElement.innerText = header;
      trElement.append(thElement);
    });

    selectedBuswaysTableHeader.append(trElement);
  }

  createOptionElement(value, text) {
    const optionElement = document.createElement("option");
    optionElement.value = value;
    optionElement.innerText = text;
    return optionElement;
  }

  createInputElement(type, value, text, id) {
    const containerElement = document.createElement("div");
    const inputElement = document.createElement(
      type === "textarea" ? "textarea" : "input"
    );
    const labelElement = document.createElement("label");

    containerElement.classList.add("col");

    labelElement.classList.add("form-label");
    labelElement.innerText = text;
    labelElement.htmlFor = id;

    if (type !== "textarea") inputElement.type = type;
    inputElement.value = value;
    inputElement.classList.add("form-control");
    inputElement.id = id;

    containerElement.append(labelElement);
    containerElement.append(inputElement);

    return containerElement;
  }

  initialFields = [
    {
      order: 1,
      selector: "project-no",
      options: [],
      currentValue: "",
    },
    {
      order: 2,
      selector: "project-type",
      options: [],
      currentValue: "",
    },
    {
      order: 3,
      selector: "project-sequence",
      options: [],
      currentValue: "",
    },
    {
      order: 4,
      selector: "project-modal-no",
      options: [],
      currentValue: "",
    },
    {
      order: 5,
      selector: "project-lot-no",
      options: [],
      currentValue: "",
    },
  ];

  tabSelectorFields = {
    leakageCurrent: [
      {
        type: "text",
        text: "Project Name",
        selector: "project-name",
        required: true,
        value: "",
      },
      {
        type: "text",
        selector: "customer",
        text: "Customer",
        required: true,
        value: "",
      },
      {
        type: "text",
        selector: "order-form-no",
        text: "Order Form No",
        required: true,
        value: "",
      },
      {
        type: "text",
        selector: "voltage",
        text: "Voltage (Operation)",
        required: true,
        value: "",
      },
      {
        type: "text",
        selector: "manufacturing-code",
        text: "Manufacturing Code",
        required: true,
        value: "",
      },
      {
        type: "text",
        selector: "system-configuration",
        text: "System Configuration/ IP Rating",
        required: true,
        value: "",
      },
      {
        type: "text",
        selector: "rating",
        text: "Rating",
        required: true,
        value: "",
      },
      {
        type: "date",
        selector: "date",
        text: "Date",
        required: true,
        value: "",
      },
      {
        type: "textarea",
        selector: "result",
        text: "Result",
        required: true,
        value: "",
      },
    ],
    pressureTest: [
      {
        type: "text",
        text: "Project Name",
        selector: "project-name",
        required: true,
        value: "",
      },
      {
        type: "text",
        selector: "customer",
        text: "Customer",
        required: true,
        value: "",
      },
      {
        type: "text",
        selector: "order-form-no",
        text: "Order Form No",
        required: true,
        value: "",
      },
      {
        type: "text",
        selector: "voltage",
        text: "Voltage (Operation)",
        required: true,
        value: "",
      },
      {
        type: "text",
        selector: "manufacturing-code",
        text: "Manufacturing Code",
        required: true,
        value: "",
      },
      {
        type: "text",
        selector: "system-configuration",
        text: "System Configuration/ IP Rating",
        required: true,
        value: "",
      },
      {
        type: "text",
        selector: "rating",
        text: "Rating",
        required: true,
        value: "",
      },
      {
        type: "date",
        selector: "date",
        text: "Date",
        required: true,
        value: "",
      },
    ],
    insulationTest: [
      {
        type: "text",
        text: "Project Name",
        selector: "project-name",
        required: true,
        value: "",
      },
      {
        type: "text",
        selector: "customer",
        text: "Customer",
        required: true,
        value: "",
      },
      {
        type: "text",
        selector: "order-form-no",
        text: "Order Form No",
        required: true,
        value: "",
      },
      {
        type: "text",
        selector: "voltage",
        text: "Voltage (Operation)",
        required: true,
        value: "",
      },
      {
        type: "text",
        selector: "manufacturing-code",
        text: "Manufacturing Code",
        required: true,
        value: "",
      },
      {
        type: "text",
        selector: "system-configuration",
        text: "System Configuration/ IP Rating",
        required: true,
        value: "",
      },
      {
        type: "text",
        selector: "rating",
        text: "Rating",
        required: true,
        value: "",
      },
      {
        type: "date",
        selector: "date",
        text: "Date",
        required: true,
        value: "",
      },
    ],
    visualMechInspection: [
      {
        type: "text",
        text: "Project Name",
        selector: "project-name",
        required: true,
        value: "",
      },
      {
        type: "text",
        selector: "customer",
        text: "Customer",
        required: true,
        value: "",
      },
      {
        type: "text",
        selector: "order-form-no",
        text: "Order Form No",
        required: true,
        value: "",
      },
      {
        type: "text",
        selector: "voltage",
        text: "Voltage (Operation)",
        required: true,
        value: "",
      },
      {
        type: "text",
        selector: "manufacturing-code",
        text: "Manufacturing Code",
        required: true,
        value: "",
      },
      {
        type: "text",
        selector: "system-configuration",
        text: "System Configuration/ IP Rating",
        required: true,
        value: "",
      },
      {
        type: "text",
        selector: "rating",
        text: "Rating",
        required: true,
        value: "",
      },
      {
        type: "date",
        selector: "date",
        text: "Date",
        required: true,
        value: "",
      },
    ],
  };
}

new FormHandler(data);
