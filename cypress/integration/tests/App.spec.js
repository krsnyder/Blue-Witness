const { not } = require("cheerio/lib/api/traversing");

context('Test main app can load and popular links are present and clickable', () => {
    beforeEach(() => {
      cy.visit('localhost:3000');
    });

    it('sanity check ', () => {
      expect(true).to.not.equal(false);
    });

    it('Checks incident reports links exists and navigates to it', () => {
        const incidentLink = cy.get('a').contains(/incident/i); 
        expect(incidentLink).to.exist; //eslint-disable-line
        
        incidentLink.click();
      });

});
  