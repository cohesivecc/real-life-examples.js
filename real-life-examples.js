var Webflow = Webflow || [];
Webflow.push(function () {
  class RLE {
    constructor(props) {
      this.container = $("[rle-container]");

      if (this.container.length) {
        const _this = this;

        this.tier = null;
        this.level = null;
        this.currentExampleSlug = null;
        this.examples = [];
        this.language = this.container.attr('rle-language')
        this.menu = this.container.find("[rle-menu]");
        this.slider = this.container.find("[rle-slider]");
        this.preloader = this.container.find('[rle-preloader]');
        this.restartButton = this.container.find('[rle-restart]');
        this.showExampleButton = this.container.find("[rle-continue-button]");

        // grab list of RLEs from the collection list
        this.container
          .find("[rle-example]")
          .each(function (index, ele) {
            const example = new RLExample({ ele, index, language: _this.language });
            _this.examples.push(example);
          });

        // setup button listeners
        this.container.on('click', '[rle-selection-option]', function() {
          _this.setSelection($(this).attr("rle-selection-group"), $(this).attr("rle-selection-value"));
        })

        this.showExampleButton.on("click", function () {
          if (!$(this).hasClass("is-disabled")) {
            _this.showCurrentExample();
          }
        });

        this.restartButton.on('click', function() {
          _this.showMenu()
        })


        $(document).off('slider-event', '[rle-slider]').on('slider-event', '[rle-slider]', function(e, data) {
          const example = _this.findCurrentExample();
          example.trackSlide(data);
        });
      }
      this.updateAndShowSlider = this.updateAndShowSlider.bind(this);
    }

    setSelection(group, value) {
      group == "coverage-tier" ? this.setTier(value) : this.setLevel(value);
      const allButtons = this.container.find(
        `[rle-selection-option][rle-selection-group='${group}']`
      );
      const selected = this.container.find(
        `[rle-selection-option][rle-selection-group='${group}'][rle-selection-value='${value}']`
      );

      allButtons
        .removeClass("is-selected")
        .find("[rle-selection-icon]")
        .removeClass("is-selected");
      selected
        .addClass("is-selected")
        .find("[rle-selection-icon]")
        .addClass("is-selected");
    }

    setTier(tier) {
      this.tier = tier;
      if (this.level) {
        this.showExampleButton.removeClass("is-disabled");
      }
    }
    setLevel(level) {
      this.level = level;
      if (this.tier) {
        this.showExampleButton.removeClass("is-disabled");
      }
    }

    findExampleFor({ tier, level }) {
      return this.examples.find((example) => {
        return example.tier == tier && example.level == level;
      });
    }
    findCurrentExample() {
      return this.findExampleFor({ tier: this.tier, level: this.level });
    }

    showCurrentExample() {
      const example = this.findCurrentExample();
      if (example) {
        this.preloader.show();
        example.fetch({ callback: this.updateAndShowSlider });
      } else {
        alert("Please select a Coverage Tier and a Level of Care.");
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
    constructor({ ele, index, language }) {
      this.ele = ele;
      this.index = index;
      this.language = language;

      this.tier = $(this.ele).attr("rle-coverage-tier");
      this.level = $(this.ele).attr("rle-level-of-care");
      this.src = $(this.ele).attr("href");
      this.slides = null;
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
            let selector = `[rle-slides="list"]`
            if(_this.language) {
              selector = `${selector}[rle-language="${_this.language}"]`
            }
            selector = `${selector} [rle-slide]:not('.w-condition-invisible')`
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
        // console.log("Tracking slide", this.tier, this.level, index);
        gtag('event', `real_life_examples_${this.language}`, {
          'event_category': `${this.tier} > ${this.level}`,
          'event_label': `Slide #${index + 1}`,
        });
        // gtag('event', `${this.tier} > ${this.level}`, {
        //   'event_category': `Real Life Examples (${this.language})`,
        //   'event_label': `Slide #${index + 1}`,
        // });
        slide.data('viewed', true);
      }
    }
  }

  const rle = new RLE();
});