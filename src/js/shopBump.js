// A normal shop save navigates away. Keep the report in this tab until the
// returned edit page confirms that every submitted price was saved.
export const ShopBump = {
  lastResult: null,
  propertyId: null,
  onProgress: null,
  init(table, controls) {
    this.lastResult = null;
    const heading = [...document.querySelectorAll('b')].find((element) =>
      element.textContent.trim() === 'Управление счетом');
    const form = table.closest('form');
    const save = form?.querySelector(
      'input[type="submit"][value="Сохранить настройки магазина"]'
    );
    const id = form?.querySelector('input[name="id"]')?.value;
    this.propertyId = id || null;
    if (!heading || !save || !id || document.querySelector('[data-test-bump-prices]')) {
      return;
    }

    const check = document.createElement('span');
    check.className = 'green';
    check.textContent = ' ✓ ';
    check.style.visibility = 'hidden';
    check.setAttribute('data-test-bump-prices-complete', '');
    check.title = 'Shop prices saved';
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'apply-all';
    button.textContent = 'bump prices';
    button.setAttribute('data-test-bump-prices', '');
    const progressDisplay = document.createElement('span');
    progressDisplay.setAttribute('data-test-bump-prices-progress', '');
    progressDisplay.style.marginLeft = '6px';
    progressDisplay.hidden = true;
    const progressBar = document.createElement('progress');
    progressBar.setAttribute('aria-label', 'Shop items checked');
    progressBar.style.width = '80px';
    progressBar.style.verticalAlign = 'middle';
    progressBar.style.marginRight = '4px';
    const progressText = document.createElement('span');
    progressDisplay.append(progressBar, progressText);
    heading.parentElement.append(check, button, progressDisplay);
    const showProgress = ({ checked, total }) => {
      progressDisplay.hidden = false;
      progressBar.max = total || 1;
      progressBar.value = total ? checked : 1;
      progressText.textContent = `${checked}/${total}`;
      progressBar.setAttribute('aria-valuetext', progressText.textContent);
    };
    controls.onProgress = (progress) => {
      if (button.disabled) {
        showProgress(progress);
        this.onProgress?.(progress);
      }
    };

    const key = `gw-bump-prices:${id}`;
    try {
      const pending = JSON.parse(sessionStorage.getItem(key) || 'null');
      if (pending) {
        sessionStorage.removeItem(key);
        const saved = pending.prices.every(({ name, value }) =>
          form.elements.namedItem(name)?.value === value);
        if (saved) {
          this.lastResult = { ok: true, changes: pending.changes };
          check.style.visibility = 'visible';
          showProgress({ checked: pending.prices.length, total: pending.prices.length });
          console.log('bump prices: changed items', pending.changes);
        } else {
          this.lastResult = { ok: false, error: 'Saved prices did not match the submitted prices' };
          console.error('bump prices: saved prices did not match the submitted prices');
        }
      }
    } catch (error) {
      this.lastResult = { ok: false, error: error.message };
      sessionStorage.removeItem(key);
      console.error('bump prices: could not restore save result', error);
    }

    button.onclick = async () => {
      if (button.disabled) return;
      button.disabled = true;
      check.style.visibility = 'hidden';
      try {
        if (!controls.countButton.disabled) {
          controls.countButton.onclick({ render: false, scroll: false });
        } else if (controls.progress) {
          showProgress(controls.progress);
        }
        const recommendations = await controls.countPromise;
        if (controls.applyAll.disabled) {
          throw new Error('Shop price calculation did not finish');
        }
        const before = recommendations.map(({ row, input, itemId, seller, sellerPrice, sellerUrl }) => {
          return { input, item: row.cells[0].textContent.trim(),
            itemId, from: Number(input.value), seller, sellerPrice, sellerUrl };
        });
        controls.applyAll.onclick({ recommendations, scroll: false });
        const changes = before.filter(({ input, from }) => Number(input.value) !== from)
          .map(({ input, item, itemId, from, seller, sellerPrice, sellerUrl }) => ({
            item, itemId, from, sellerPrice, to: Number(input.value), seller, sellerUrl,
          }));
        if (!changes.length) {
          sessionStorage.removeItem(key);
          this.lastResult = { ok: true, changes: [] };
          check.style.visibility = 'visible';
          check.title = 'Shop prices checked · no changes';
          button.disabled = false;
          controls.countButton.disabled = false;
          console.log('bump prices: changed items', []);
          return this.lastResult;
        }
        check.title = 'Shop prices saved';
        const prices = before.map(({ input }) => ({ name: input.name, value: input.value }));
        // Keep the save request at least 200ms after the last price request.
        await new Promise((resolve) => setTimeout(resolve, 200));
        sessionStorage.setItem(key, JSON.stringify({ prices, changes }));
        save.click();
        return { ok: true, saving: true };
      } catch (error) {
        sessionStorage.removeItem(key);
        button.disabled = false;
        console.error('bump prices failed', error);
        return { ok: false, error: error.message };
      }
    };
  },
};
