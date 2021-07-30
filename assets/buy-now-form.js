class BuyNowForm extends HTMLElement {
  constructor(){
    super()

    this.form = this.querySelector('form');
    this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
  }

  onSubmitHandler(evt) {
    evt.preventDefault();

    const submitButton = this.querySelector('[type="submit"]');

    submitButton.setAttribute('disabled', true);
    submitButton.classList.add('loading');

    const body = JSON.stringify({...JSON.parse(serializeForm(this.form))});

    fetch(`${routes.cart_add_url}`, { ...fetchConfig('javascript'), body })
      .then((response) => response.json())
      .then(() => window.location.href = '/checkout')
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        // submitButton.classList.remove('loading');
        // submitButton.removeAttribute('disabled');
      });
  }
}

customElements.define('buy-now-form', BuyNowForm)