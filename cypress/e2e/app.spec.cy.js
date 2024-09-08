describe('MOWED App', () => {
  it('should load the homepage', () => {
    cy.visit('/', { failOnStatusCode: false })
    cy.get('h1').should('contain', 'MOWED')
    cy.contains('Mathematical Optimization With End-user Devices')
  })
})
