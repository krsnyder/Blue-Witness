
context('Actions', () => {
    beforeEach(() => {
      cy.visit('localhost:3000');
    });

    it('Navigate to incident reports', () => {
        cy.get('a').contains(/incident/i) 
        .click();
    
      });
});
  