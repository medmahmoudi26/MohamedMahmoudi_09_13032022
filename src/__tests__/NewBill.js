import { fireEvent, prettyDOM, screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import {ROUTES, ROUTES_PATH} from "../constants/routes";
import { localStorageMock } from "../__mocks__/localStorage.js"
import store from "../__mocks__/store";
import BillsUI from "../views/BillsUI.js";


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page...", () => {

    let newbill;
    beforeAll(() => {
      const html = NewBillUI()
      document.body.innerHTML = html

      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({pathname});
      };

      Object.defineProperty(window, "localStorage", {value: localStorageMock});
     
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
          email: "employee@test.tld",
          password: "employee",
          status: "connected",
        })
      );

      Object.defineProperty(window, "location", {
        value: {
          hash: ROUTES_PATH["NewBill"],
        },
      });

      newbill = new NewBill({ document, onNavigate, store: null, localStorage });
    })

    test("...then i should see a form with a submit button", () => {
      expect(screen.getByTestId('form-new-bill')).toBeTruthy()
    })
    
    describe('... and i upload a new file', () => {

      /** 
       * Change on input file button
       */
      test("the file name should be found in the input", () => {
        const handleChangeFile = jest.fn(newbill.handleChangeFile);
        const uploadInput = screen.getByTestId("file");
  
        uploadInput.addEventListener('change', handleChangeFile)
        fireEvent.change(uploadInput, {
          target: {
            files: [new File(["justificatif.jpg"], "justificatif.jpg", { type: "image/jpg" })]
          }
        });
  
        expect(handleChangeFile).toHaveBeenCalledTimes(1);
        expect(uploadInput.files[0].name).toBe("justificatif.jpg");
  
      })

      /**
       * Select wrong file format
       */
      test("it should reject a non valid image format", () => {
      window.alert = jest.fn();
      const handleChangeFile = jest.fn(newbill.handleChangeFile);
      const uploadInput = screen.getByTestId("file");
      
      uploadInput.addEventListener('change', handleChangeFile)
      fireEvent.change(uploadInput, {
        target: {
          files: [new File(["justificatif.doc"], "justificatif.doc", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })]
        }
      });

      let alert = jest.spyOn( window, 'alert' )
      expect( alert ).toHaveBeenCalled();

      })
    
      /**
       * Submit the form
       */
      test("then i submit the form, it should create a new bill", () => {
        const handleSubmit = jest.fn(newbill.handleSubmit);
        const form = screen.getByTestId("form-new-bill");
        form.addEventListener('submit', handleSubmit);
        fireEvent.submit(form);
        expect(handleSubmit).toHaveBeenCalled();
      })
      
      
    })
    
    /** 
     * Test d'intégration POST
     */
    describe("When i create a new Bill", () => {

      const newBill = {
        id: 'qslkjfqmlv6549853',
        name: "newBill",
        email: "yoann@bdl.com",
        type: "Services en ligne",
        vat: "70",
        pct: 8,
        amount: 100,
        status: "pending",
        date: "2021-12-20",
        commentary: "New bill test",
        fileName: "justificatif.png",
        fileUrl: "https://test.storage.tld/v0/b/billable-677b6.a…f-1.jpg?alt=media&token=4df6ed2c-12c8-42a2-b013-346c1346f732"
       };

       test("new bill should be added to the mocked bills list", async () => {
        const storeSpy = jest.spyOn(store, "post");
        const bills = await store.post(newBill);
        expect(storeSpy).toHaveBeenCalledTimes(1);
        expect(bills.data.length).toEqual(5);
        })

        test("add bills to API and fails with 404 message error", async () => {
          store.post.mockImplementationOnce(() =>
            Promise.reject(new Error("Erreur 404"))
          )
          const html = BillsUI({ error: "Erreur 404" })
          document.body.innerHTML = html
          const message = await screen.getByText(/Erreur 404/)
          expect(message).toBeTruthy()
        })

        test("add messages to API and fails with 500 message error", async () => {
          store.post.mockImplementationOnce(() =>
            Promise.reject(new Error("Erreur 500"))
          )
          const html = BillsUI({ error: "Erreur 500" })
          document.body.innerHTML = html
          const message = await screen.getByText(/Erreur 500/)
          expect(message).toBeTruthy()
        })

    })

  
    })
  })