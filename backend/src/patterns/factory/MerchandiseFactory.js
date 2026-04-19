/**
 * Factory Pattern — MerchandiseFactory
 * Types: tshirt, hoodie, cap, mug  (no 'other')
 * Sizes: tshirt/hoodie → [XS,S,M,L,XL,XXL]; cap/mug → [Standard]
 */
const makeProduct = (type, defaultSizes) => class {
  constructor(data) {
    this.type           = type;
    this.name           = data.name;
    this.description    = data.description || '';
    this.price          = data.price;
    this.availableSizes = data.availableSizes && data.availableSizes.length > 0 ? data.availableSizes : defaultSizes;
    this.imageUrl       = data.imageUrl || '';
    this.clubId         = data.clubId;
  }
  validate() { return this.name && this.price > 0 && this.clubId; }
  toDocument() {
    return {
      type: this.type, name: this.name, description: this.description,
      price: this.price, availableSizes: this.availableSizes,
      imageUrl: this.imageUrl, clubId: this.clubId,
    };
  }
};

const TshirtProduct = makeProduct('tshirt', ['XS', 'S', 'M', 'L', 'XL', 'XXL']);
const HoodieProduct = makeProduct('hoodie', ['XS', 'S', 'M', 'L', 'XL', 'XXL']);
const CapProduct    = makeProduct('cap',    ['Standard']);
const MugProduct    = makeProduct('mug',    ['Standard']);

class MerchandiseFactory {
  static create(type, data) {
    switch (type) {
      case 'tshirt':  return new TshirtProduct(data);
      case 'hoodie':  return new HoodieProduct(data);
      case 'cap':     return new CapProduct(data);
      case 'mug':     return new MugProduct(data);
      default: throw new Error(`Unknown merchandise type: ${type}`);
    }
  }
}

module.exports = { MerchandiseFactory, TshirtProduct, HoodieProduct, CapProduct, MugProduct };
