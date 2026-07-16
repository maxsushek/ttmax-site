export type Messages = {
  meta: {
    title: string;
    titleTemplate: string;
    description: string;
    keywords: string[];
  };
  nav: {
    rackets: string;
    bases: string;
    rubbers: string;
    apparel: string;
    balls: string;
    accessories: string;
    brands: string;
    blog: string;
    cart: string;
    catalog: string;
    contactUs: string;
  };
  hero: {
    badge: string;
    title1: string;
    title2: string;
    subtitle: string;
    brandsAccent: string;
    ctaPrimary: string;
    ctaSecondary: string;
    stats: {
      products: string;
      brands: string;
      experience: string;
    };
    scroll: string;
  };
  categories: {
    kicker: string;
    titleMuted: string;
    titleAccent: string;
    seeAll: string;
    cta: string;
    productsCount: string;
    items: {
      bases: { label: string; desc: string };
      rubbers: { label: string; desc: string };
      apparel: { label: string; desc: string };
      balls: { label: string; desc: string };
    };
  };
  products: {
    kicker: string;
    titleMuted: string;
    titleAccent: string;
    seeAll: string;
    viewProduct: string;
    addToCart: string;
    added: string;
    categories: {
      base: string;
      rubber: string;
      ball: string;
      apparel: string;
      shoes: string;
      accessory: string;
      bag: string;
      net: string;
    };
    badges: {
      hit: string;
      new: string;
      sale: string;
    };
  };
  brands: {
    kicker: string;
    title: string;
    productsCount: string;
  };
  trustBar: {
    delivery: string;
    returns: string;
    secure: string;
    rating: string;
  };
  cta: {
    kicker: string;
    title1: string;
    title2: string;
    subtitle: string;
    form: {
      name: string;
      phone: string;
      email: string;
      submit: string;
      submitting: string;
      success: string;
      error: string;
      note: string;
    };
  };
  faq: {
    kicker: string;
    title: string;
    items: ReadonlyArray<{ q: string; a: string }>;
  };
  cart: {
    title: string;
    empty: string;
    emptyHint: string;
    itemsCount: string;
    subtotal: string;
    delivery: string;
    free: string;
    total: string;
    freeShipFrom: string;
    freeShipReached: string;
    checkout: string;
    continueShopping: string;
    trust: {
      payment: string;
      delivery: string;
      returns: string;
    };
  };
  checkout: {
    title: string;
    secureCheckout: string;
    summary: string;
    steps: {
      delivery: string;
      payment: string;
      confirm: string;
    };
    delivery: {
      method: string;
      contact: string;
      np: { label: string; sub: string };
      ukrposhta: { label: string; sub: string };
      pickup: { label: string; sub: string };
      fields: {
        fullName: string;
        fullNamePlaceholder: string;
        phone: string;
        phonePlaceholder: string;
        email: string;
        emailPlaceholder: string;
        city: string;
        cityPlaceholder: string;
        npBranch: string;
        npBranchPlaceholder: string;
      };
      optional: string;
      trustNote: string;
      next: string;
    };
    payment: {
      method: string;
      apple: { label: string; sub: string };
      cod: { label: string; sub: string };
      card: { label: string; sub: string };
      cardNum: string;
      cardExp: string;
      cardCvv: string;
      cardTrust: string;
      next: string;
    };
    confirm: {
      agreement: string;
      agreementLink: string;
      submit: string;
    };
    success: {
      title: string;
      orderNumber: string;
      emailNote: string;
      emailFallback: string;
      deliveryNote: string;
      back: string;
    };
    edit: string;
  };
  validators: {
    required: string;
    fullName: string;
    phone: string;
    email: string;
    cityTooShort: string;
    cardNum: string;
    cardExp: string;
    cardExpired: string;
    cardCvv: string;
    agreement: string;
  };
  footer: {
    tagline: string;
    phone: string;
    columns: {
      catalog: string;
      brands: string;
      info: string;
    };
    catalogLinks: ReadonlyArray<string>;
    infoLinks: ReadonlyArray<string>;
    privacy: string;
    terms: string;
    copyright: string;
  };
  common: {
    open: string;
    close: string;
    loading: string;
  };
};
