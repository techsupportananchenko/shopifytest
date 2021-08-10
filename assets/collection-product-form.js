class CollectionProductForm extends HTMLElement {
  constructor() {
    super();

    this.form = this.querySelector('form');
    this.form.addEventListener('submit', this.onSubmitHandler.bind(this));

    this.cartNotification = document.querySelector('cart-notification');

    this.variantsSelector = this.form.querySelector('select.section-variant');
    this.variantsSelector ? 
      this.variantsSelector.addEventListener('change', this.onVariantChangeHandler.bind(this))
      :
      null;
    this.priceSelector = this.form.closest('.card-wrapper').querySelector('.price');
    this.media = this.form.closest('.card-wrapper').querySelectorAll('.media img');
    this.productUrl = this.form.closest('.card-wrapper').querySelectorAll('.product-url');
    this.formErrorWrapper = this.form.querySelector('.product-form__error-message-wrapper');
  }

  onSubmitHandler(evt) {
    const index = this.variantsSelector.selectedIndex;
    
    if([null, undefined].includes(index)) return
    
    evt.preventDefault();

    const selectedOption = this.variantsSelector.options[index];
    const selectedVariantId = selectedOption.value;
    const selectedVariantQuantity = selectedOption.dataset.availableQuantity;
    const selectedVariantTitle = selectedOption.dataset.variantTitle;
    const selectedProductTitle = selectedOption.dataset.productTitle;
    const submitButton = this.querySelector('[type="submit"]');

    if (submitButton) {
      submitButton.setAttribute('disabled', true);
      submitButton.classList.add('loading');
    }

    this.checkVariantAvailability()
      .then(cart => {
        const addedItem = cart.items? 
          cart.items.filter(item => item.id == selectedVariantId)[0]
          :
          null
        const addedVariantQuantity = addedItem? 
          addedItem.quantity
          :
          null

        if (addedVariantQuantity && selectedVariantQuantity && 
          addedVariantQuantity >= selectedVariantQuantity
        ) {
          if (submitButton) {
            submitButton.classList.remove('loading');
            submitButton.removeAttribute('disabled');
          }
          this.showError(selectedVariantQuantity, selectedVariantTitle, selectedProductTitle)
        } else {
          this.submitForm()
        }
      })
      .catch((e) => {
        console.error(e);
      })
  }

  showError(selectedVariantQuantity, selectedVariantTitle, selectedProductTitle){
    if(this.formErrorWrapper){
      const error = this.formErrorWrapper.querySelector('.product-form__error-message');
      error.innerHTML = `All 
        [${selectedVariantQuantity}] 
        ${selectedVariantTitle} - 
        ${selectedProductTitle} are in your cart.
      `
      this.formErrorWrapper.classList.remove('hidden');
    }
  }

  submitForm(){
    const submitButton = this.querySelector('[type="submit"]');
    this.cartNotification.setActiveElement(document.activeElement);

    const body = JSON.stringify({
      ...JSON.parse(serializeForm(this.form)),
      sections: this.cartNotification.getSectionsToRender().map((section) => section.id),
      sections_url: window.location.pathname
    });

    fetch(`${routes.cart_add_url}`, { ...fetchConfig('javascript'), body })
      .then((response) => response.json())
      .then((parsedState) => {
        this.cartNotification.renderContents(parsedState);
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        if (submitButton) {
          submitButton.classList.remove('loading');
          submitButton.removeAttribute('disabled');
        }
      });
  }

  onVariantChangeHandler(evt){
    const index = this.variantsSelector.selectedIndex;

    if([null, undefined].includes(index)) return

    const selectedOption = evt.target.options[index];
    const variantId = evt.target.value;
    const variantPrice = selectedOption.getAttribute('data-price');
    const variantUrl = selectedOption.getAttribute('data-url');

    if(variantPrice && this.priceSelector){
      this.priceSelector.innerText = `${variantPrice}`
    }

    if(variantId && this.media){
      this.media.forEach(image => {
        const imageVariantId = image.dataset.variantImageId;

        image.classList.add('hidden');

        if(imageVariantId == variantId){
          if (!image.src.includes('no-image')) {
            image.classList.remove('hidden');
          } else {
            this.media[0].classList.remove('hidden');
          }
        }
      })
    }

    if(variantUrl && this.productUrl){
      this.productUrl.forEach(url => {
        url.setAttribute('href', variantUrl);
      })
    }

    if(this.formErrorWrapper){
      this.formErrorWrapper.classList.add('hidden');
    }
  }

  async checkVariantAvailability(){
    const data = await fetch(`/cart.js`, { 
      method: "GET", 
      headers: {'Content-Type': 'application/json'}, 
    })
      .then((response) => response.json())
      .catch((e) => {
        console.error(e);
      })

    return data;
  }
}

customElements.define('collection-product-form', CollectionProductForm);
