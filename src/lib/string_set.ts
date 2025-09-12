class StringSet {
  _items: Record<string, number>;
  _nums: Record<string, number>;
  _length: number;

  constructor(items?: Array<string | number>) {
    this._items = {};
    this._nums = {};
    this._length = items ? items.length : 0;
    if (!items) return;

    for (let i = 0, l = items.length; i < l; i++) {
      this.add(items[i]);
      if (items[i] === undefined) continue;
      if (typeof items[i] === 'string') this._items[items[i]] = i;
      else this._nums[items[i]] = i;
    }
  }

  add(x: string | number) {
    if (this.has(x)) return this;
    this._length++;
    if (typeof x === 'string') this._items[x] = this._length;
    else this._nums[x] = this._length;
    return this;
  }

  delete(x: string | number) {
    if (this.has(x) === false) return this;
    this._length--;
    delete this._items[x];
    delete this._nums[x];
    return this;
  }

  has(x: string | number) {
    if (typeof x !== 'string' && typeof x !== 'number') return false;
    return this._items[x] !== undefined || this._nums[x] !== undefined;
  }

  values() {
    const values: {k: string | number, v: number}[] = [];
    Object.keys(this._items).forEach((k) => {
      values.push({ k, v: this._items[k] });
    });
    Object.keys(this._nums).forEach((k) => {
      values.push({ k: JSON.parse(k), v: this._nums[k] });
    });

    return values.sort(({v: v1}, {v: v2}) => v1 - v2).map(({k}) => k);
  }

  clear() {
    this._length = 0;
    this._items = {};
    this._nums = {};
    return this;
  }
}

export default StringSet;
