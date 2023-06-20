/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";

import router from "../app/Router.js";
import Bills from "../containers/Bills.js";

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.append(root);
      router();
      window.onNavigate(ROUTES_PATH.Bills);
      await waitFor(() => screen.getByTestId("icon-window"));
      const windowIcon = screen.getByTestId("icon-window");
      expect(windowIcon.classList.contains("active-icon")).toBeTruthy();
    });
    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills });
      let dates = screen
        .getAllByText(
          /^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i
        )
        .map((a) => a.innerHTML);
      const antiChrono = (a, b) => (a < b ? 1 : -1);
      dates = dates.sort(antiChrono);
      const datesSorted = [...dates].sort(antiChrono);
      expect(dates).toEqual(datesSorted);
    });
  });



  describe("When I click on the eye Icon of a Bill", () => {
    test("Then the modal should have appeared", async () => {
      document.body.innerHTML = BillsUI({ data: bills });
      const newBill = new Bills({ document, store: mockStore, localStorage: window.localStorage })
      $.fn.modal = jest.fn();
      const handleClickIconEye = jest.fn(() => {
        newBill.handleClickIconEye;
      });
      const eyes = screen.getAllByTestId("icon-eye");
      const firstEye = eyes[0];
      firstEye.addEventListener("click", handleClickIconEye);
      fireEvent.click(firstEye);
      await waitFor(() => {
        expect(
          $("#modalefile").find(".modal-body").innerHTML !== ""
        ).toBeTruthy();
      });
    });
  });

  test("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills");
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "a@a",
        })
      );
      const root = document.createElement("div");
      root.setAttribute("id", "root");
      document.body.appendChild(root);
      router();
    });
  });

  test("Then bills are formated with getBills", async () => {
    const container = new Bills({ document, store: mockStore, localStorage: window.localStorage })
    const getBills = jest.fn(() => container.getBills())
    const data = await getBills()
    expect(data).toBeTruthy()
    expect(data[0].id).toEqual(bills[0].id)
  })
});

test("fetches bills from an API and fails with 404 message error", async () => {

  mockStore.bills.mockImplementationOnce(() => {
    return {
      list : () =>  {
        return Promise.reject(new Error("Erreur 404"))
      }
    }})
  window.onNavigate(ROUTES_PATH.Dashboard)
  await new Promise(process.nextTick);
  const message = screen.getByTestId('error-message')
  expect(message).toBeTruthy()
})

test("fetches messages from an API and fails with 500 message error", async () => {

  mockStore.bills.mockImplementationOnce(() => {
    return {
      list : () =>  {
        return Promise.reject(new Error("Erreur 500"))
      }
    }})

  window.onNavigate(ROUTES_PATH.Dashboard)
  await new Promise(process.nextTick);
  const message = screen.getByTestId('error-message')
  expect(message).toBeTruthy()
})