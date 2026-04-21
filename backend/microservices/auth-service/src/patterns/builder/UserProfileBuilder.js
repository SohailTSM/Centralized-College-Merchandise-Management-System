/**
 * Builder Pattern — UserProfileBuilder
 * Constructs complex UserProfile objects step-by-step with validation.
 */

class UserProfile {
  constructor({ name, email, contactNumber, sizeProfile, address }) {
    this.name = name;
    this.email = email;
    this.contactNumber = contactNumber;
    this.sizeProfile = sizeProfile;
    this.address = address;
  }
}

class UserProfileBuilder {
  constructor() {
    this._name = '';
    this._email = '';
    this._contactNumber = '';
    this._sizeProfile = { tshirt: 'M', hoodie: 'M', other: 'M' };
    this._address = '';
  }

  setName(name) {
    this._name = name;
    return this;
  }

  setEmail(email) {
    this._email = email;
    return this;
  }

  setContact(contactNumber) {
    this._contactNumber = contactNumber;
    return this;
  }

  setSizeProfile({ tshirt, hoodie, other } = {}) {
    this._sizeProfile = {
      tshirt: tshirt || this._sizeProfile.tshirt,
      hoodie: hoodie || this._sizeProfile.hoodie,
      other:  other  || this._sizeProfile.other,
    };
    return this;
  }

  setAddress(address) {
    this._address = address;
    return this;
  }

  validate() {
    if (!this._name || !this._email) {
      throw new Error('UserProfileBuilder: name and email are required');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this._email)) {
      throw new Error('UserProfileBuilder: invalid email format');
    }
    return true;
  }

  build() {
    this.validate();
    return new UserProfile({
      name: this._name,
      email: this._email,
      contactNumber: this._contactNumber,
      sizeProfile: this._sizeProfile,
      address: this._address,
    });
  }
}

module.exports = { UserProfileBuilder, UserProfile };
