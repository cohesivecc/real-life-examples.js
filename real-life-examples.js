var Webflow = Webflow || [];
Webflow.push(function () {
  /**
   * Real Life Examples (RLE)
   *
   * Tagging convention (all in the Webflow DOM, nothing hard-coded here):
   *
   *   [rle-container]                       wraps the whole component
   *   [rle-selection-option]                a clickable choice, with:
   *     rle-selection-group="<group>"       which parameter it sets (e.g. "coverage-tier")
   *     rle-selection-value="<value>"       the value it sets
   *   [rle-example]                         a (hidden) link to example content, with one
   *     rle-<group>="<value>"               attribute per selection group on the page
   *   [rle-selection-text="<group>"]        any element, anywhere on the page, whose text
   *                                         mirrors the selected value for <group>. Its
   *                                         original text is the placeholder shown until
   *                                         a value is selected.
   *   [rle-selection-state="<group>"]       any element, anywhere on the page, that gets
   *                                         the is-selected class once <group> has a value
   *
   * The set of required parameters is discovered from the distinct
   * rle-selection-group values present in the container. The continue button
   * is enabled only once every discovered group has a selection.
   */
  class RLE {
    constructor(props) {
      this.container = $("[rle-container]");

      if (this.container.length) {
        const _this = this;

        this.selections = {};        // { [group]: value }
        this.examples = [];
        this.language = this.container.attr('rle-language');
        this.menu = this.container.find("[rle-menu]");
        this.slider = this.container.find("[rle-slider]");
        this.preloader = this.container.find('[rle-preloader]');
        this.restartButton = this.container.find('[rle-restart]');
        this.showExampleButton = this.container.find("[rle-continue-button]");

        // discover the selection groups from the option buttons, in DOM order
        this.groups = [];
        this.container.find("[rle-selection-option]").each(function () {
          const group = $(this).attr("rle-selection-group");
          if (group && !_this.groups.includes(group)) {
            _this.groups.push(group);
          }
        });

        // remember each text display's authored text as its placeholder
        $("[rle-selection-text]").each(function () {
          $(this).data("rle-placeholder", $(this).text());
        });

        // grab list of RLEs from the collection list
        this.container
          .find("[rle-example]")
          .each(function (index, ele) {
            const example = new RLExample({ ele, index, language: _this.language, groups: _this.groups });
            _this.examples.push(example);
          });

        // setup button listeners
        this.container.on('click', '[rle-selection-option]', function() {
          _this.setSelection($(this).attr("rle-selection-group"), $(this).attr("rle-selection-value"));
        });

        this.showExampleButton.on("click", function () {
          if (!$(this).hasClass("is-disabled")) {
            _this.showCurrentExample();
          }
        });

        this.restartButton.on('click', function() {
          _this.showMenu();
        });

        $(document).off('slider-event', '[rle-slider]').on('slider-event', '[rle-slider]', function(e, data) {
          const example = _this.findCurrentExample();
          if (example) example.trackSlide(data);
        });

        this.groups.forEach((group) => this.renderSelection(group));
        this.updateContinueButton();
      }
      this.updateAndShowSlider = this.updateAndShowSlider.bind(this);
    }

    setSelection(group, value) {
      if (!group) return;
      this.selections[group] = value;

      // Filter by attribute value in JS rather than building an attribute
      // selector, so values like "Employee + Child(ren)" or "< $100,000"
      // never need escaping.
      const allButtons = this.container
        .find("[rle-selection-option]")
        .filter(function () { return $(this).attr("rle-selection-group") === group; });
      const selected = allButtons
        .filter(function () { return $(this).attr("rle-selection-value") === value; });

      allButtons
        .removeClass("is-selected")
        .find("[rle-selection-icon]")
        .removeClass("is-selected");
      selected
        .addClass("is-selected")
        .find("[rle-selection-icon]")
        .addClass("is-selected");

      this.renderSelection(group);
      this.updateContinueButton();
    }

    // Reflect a group's current value in every element bound to it.
    // Searched page-wide so selections can be echoed outside the container.
    renderSelection(group) {
      const value = this.selections[group];
      const byGroup = (attr) => function () { return $(this).attr(attr) === group; };

      $("[rle-selection-text]")
        .filter(byGroup("rle-selection-text"))
        .each(function () {
          $(this).text(value || $(this).data("rle-placeholder"));
        });

      $("[rle-selection-state]")
        .filter(byGroup("rle-selection-state"))
        .toggleClass("is-selected", !!value);
    }

    allSelectionsMade() {
      return this.groups.every((group) => !!this.selections[group]);
    }

    updateContinueButton() {
      this.showExampleButton.toggleClass("is-disabled", !this.allSelectionsMade());
    }

    findExampleFor(selections) {
      return this.examples.find((example) => example.matches(selections));
    }
    findCurrentExample() {
      return this.findExampleFor(this.selections);
    }

    showCurrentExample() {
      const example = this.findCurrentExample();
      if (example) {
        this.preloader.show();
        example.fetch({ callback: this.updateAndShowSlider });
      } else if (!this.allSelectionsMade()) {
        alert("Please make a selection for each option.");
      } else {
        alert("Sorry, we don't have an example for that combination yet.");
      }
    }

    showMenu() {
      this.menu.show();
      this.slider.hide();
      this.restartButton.hide();
    }

    updateAndShowSlider(example) {
      const mask = this.slider.find(".w-slider-mask");

      mask.find("> *").remove();
      mask.append(example.slides);
      mask.find("[rle-slide]").addClass("w-slide");
      Webflow.require("slider").redraw();
      window.dispatchEvent(new Event("resize"));
      this.slider.find(".w-slider-dot:first").trigger("click");
      this.menu.hide();
      this.slider.show();
      this.restartButton.show();
      this.preloader.hide();
    }
  }

  class RLExample {
    constructor({ ele, index, language, groups }) {
      this.ele = ele;
      this.index = index;
      this.language = language;
      this.groups = groups;

      // one attribute per selection group: rle-<group>="<value>"
      this.params = {};
      groups.forEach((group) => {
        this.params[group] = $(this.ele).attr(`rle-${group}`);
      });

      this.src = $(this.ele).attr("href");
      this.slides = null;
    }

    /**
     * Does this example satisfy the given selections?
     *
     * Current strategy: exact match. Every group on the page must have the
     * same value on this link as the user selected. A link missing one of the
     * rle-<group> attributes will never match.
     */
    matches(selections) {
      return this.groups.every((group) => this.params[group] === selections[group]);
    }

    // e.g. "Employee Only > Fewer Medical Expenses > LSC Communications > < $100,000"
    label() {
      return this.groups.map((group) => this.params[group]).join(" > ");
    }

    fetch({ callback }) {
      if (this.slides) {
        // already fetched!
        if (typeof callback === "function") {
          callback(this);
        }
      } else {
        const _this = this;
        $.get({
          url: this.src,
          success: function (data) {
            let result = $('<output>').append($.parseHTML(data));
            let selector = `[rle-slides="list"]`;
            if(_this.language) {
              selector = `${selector}[rle-language="${_this.language}"]`;
            }
            selector = `${selector} [rle-slide]:not('.w-condition-invisible')`;
            _this.slides = result.find(selector);
            if (typeof callback === "function") {
              callback(_this);
            }
          },
        });
      }
    }

    trackSlide(data) {
      const { index } = data;
      const slide = $(this.slides[index]);
      if(slide.length > 0 && !slide.data('viewed')) {
        gtag('event', `real_life_examples_${this.language}`, {
          'event_category': this.label(),
          'event_label': `Slide #${index + 1}`,
        });
        slide.data('viewed', true);
      }
    }
  }

  const rle = new RLE();
});
