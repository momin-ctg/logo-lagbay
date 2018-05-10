window.App = {};

App.device = (function() {
    return {
        touch: Modernizr.touchevents,
        wide: matchMedia("(min-width: 768px)").matches
    }
})();


App.Popup = function(popup) {
    var $html = $('html'),
        $docum = $(document),
        $popup = $('.js-'+popup),
        activeClass = 'is-opened-'+popup,
        hiddenClass = 'is-hidden',
        _this = this;
    this.open = function() {
        var d = $.Deferred();
        if (!_this.isAnimated) {
            _this.isAnimated = true;
            _this.isOpened = true;
            $html.addClass(activeClass);
            $popup[0].scrollTop = 1;
            if (!App.device.wide) {
                $popup.removeClass(hiddenClass);
            }
            if (_this.afterOpen) {
                setTimeout(function() {
                    _this.afterOpen(d);
                    d.done(function() {
                        _this.isAnimated = false;
                    })
                }, 10);
            } else { _this.isAnimated = false; }
            $docum.on('keydown.kdwn', function(ev) {
                if (ev.which === 27) {
                    _this.close();
                }
            });
        }
    };
    this.isAnimated = false;
    this.isOpened = false;
    this.afterOpen = null;
    this.beforeClose = null;
    this.close = function() {
        var close = function() {
            $html.removeClass(activeClass);
            if (!App.device.wide) { $popup.addClass(hiddenClass); }
            $docum.off('.kdwn');
            _this.isOpened = false;
            _this.isAnimated = false;
        };
        if (!_this.isAnimated) {
            _this.isAnimated = true;
            if (_this.beforeClose) {
                var d = $.Deferred();
                _this.beforeClose(d);
                d.done(close);
            } else { close(); }
        }
    };
    if (!App.device.wide) {
        $popup.addClass(hiddenClass);
    }
    if (App.device.touch) {
        $popup.on('touchstart', function(ev) {
            var top = this.scrollTop,
                totalScroll = this.scrollHeight,
                elHeight = this.offsetHeight,
                currentScroll = top + elHeight;
            if (top === 0) {
                this.scrollTop = 1;
            } else if (currentScroll === totalScroll || currentScroll + 1 === totalScroll) {
                this.scrollTop = top - 1;
            }
        });
    }
};
App.menu = new App.Popup('menu');
App.filter = new App.Popup('filter');

App.Accordion = function(slider) {
    var _this = this,
        $slider = $(slider),
        $item = $slider.find('.item'),
        $info = $slider.find('.hidden-info'),
        activeClass = 'is-opened',
        speed = 150;
    this.open = function(i) {
        if (!this.isOpened(i)) {
            this.close();
            if (App.device.wide) {
                $item.eq(i).addClass(activeClass);
                $info.eq(i).fadeIn(speed);
            } else {
                $item.eq(i).addClass(activeClass).find('.hidden-info').slideDown(speed);
            }
        }
    };
    this.close = function(i) {
        if (App.device.wide) {
            $info.hide();
            $item.removeClass(activeClass);
        } else {
            $info.slideUp(speed).parent().removeClass(activeClass);
        }
    };
    this.isOpened = function(i) {
        var info = App.device.wide ? $info.eq(i) : $item.eq(i).find('.hidden-info');
        return info.is(':visible') ? true : false;
    };
    $item.on('click', function() {
        var i = $(this).index();
        App.device.wide ? _this.open(i) : _this.isOpened(i) ? _this.close(i) : _this.open(i);
    });
};

App.Loader = function(loader) {
    var _this = this,
        $loader = $(loader),
        $area = $loader.find('.loader__area'),
        areaHeight = $loader.height(),
        areaWidth = $loader.width(),
        delay = App.device.wide ? 400 : 500;
    this.stepTranslate = 0;
    this.steps = App.device.wide ? 4 : 3;
    this.step = 1;
    this.stepWidth = Math.floor(App.device.wide ? window.innerWidth / 13 : areaWidth / (this.steps - 1));
    this.deg = function() {
        var hyp = Math.sqrt(Math.pow(areaHeight, 2) + Math.pow(_this.stepWidth, 2));
        return 180 - 90 - Math.asin(areaHeight / hyp) * 180 / 3.14;
    };
    this.start = function() {
        if (_this.step < _this.steps) {
            var flag = (_this.step - 1) % 2;
            App.device.wide
                ? _this.stepTranslate += _this.stepWidth * (flag ? 4 : 2)
                : flag ? _this.stepTranslate += _this.stepWidth * 2 : null;
            var expr = 'skew(' + (flag ? -_this.deg() : _this.deg()) + 'deg) translate3d(' + _this.stepTranslate + 'px, 0, 0)';
            $area.css({
                transform: expr,
                '-webkit-transform': expr
            });
            _this.step++;
            setTimeout(_this.start, delay);
        } else if (_this.step === _this.steps) {
            // pre finish
            $area.addClass('is-finished').css('transform', '');
            _this.step++;
            setTimeout(_this.start, delay);
        } else {
            _this.hide().onEnd();
        }
    };
    this.hide = function() {
        $loader.addClass('is-hidden');
        return this;
    };
    this.onEnd = $.noop;
    this.reset = function() {
        _this.step = 1;
        _this.stepTranslate = 0;
        $area.removeClass('is-finished');
        $loader.removeClass('is-hidden');
        return this;
    };
};

App.loader = new App.Loader('.loader');
App.loader.start();
if (App.device.wide) {
    App.loader.onEnd = function() {
        if (document.getElementById('lamp-anim')) {
            lavaAnimation.run();
        }
        setTimeout(function() {
            $('.js-works-d-list').addClass('is-loaded');
        }, 150);
    };
}

App.parallax = (function() {
    return {
        timeout: null,
        slide1: {
            isInited: false,
            obj: null
        },
        slide2: {
            isInited: false,
            obj: null
        }
    }
})();


$(function() {
    var $window = $(window),
        $docum = $(document),
        $header = $('.header'),
        $headerTopBar = $('.header__top-bar'),
        $floatMenu = $('.menu-floating'),
        $menu = $('.js-menu');

    FastClick.attach(document.body);
    SVGInjector(document.querySelector('.svg-sprite'));

    var screenSliderSettings = {
        pagination: '.js-screen-slider-pagin',
        keyboardControl: true,
        simulateTouch: false,
        paginationClickable: true,
        paginationBulletRender: function(i, className) {
            return '<div class="'+className+' bullet"><svg class="icon"><use xlink:href="#oval"></use></svg></div>';
        }
    };
    if (App.device.touch) {
        new Swiper('.js-screen-slider', screenSliderSettings);
    } else {
        new Swiper('.js-screen-slider', $.extend({}, screenSliderSettings, {
            prevButton: '.js-screen-slider-btn-prev',
            nextButton: '.js-screen-slider-btn-next',
            onSlideChangeStart: function(swiper) {
                clearTimeout(App.parallax.timeout);
                if (App.parallax.slide1.obj && App.parallax.slide1.obj.enabled) {
                    App.parallax.slide1.obj.disable();
                }
                if (App.parallax.slide2.obj && App.parallax.slide2.obj.enabled) {
                    App.parallax.slide2.obj.disable();
                }
            },
            onTransitionEnd: function(swiper) {
                App.parallax.timeout = setTimeout(function() {
                    switch (swiper.activeIndex) {
                        case 1:
                            if (!App.parallax.slide1.isInited) {
                                App.parallax.slide1.obj = new Parallax(document.getElementById('main_slide_2'));
                                App.parallax.slide1.isInited = true;
                            } else { App.parallax.slide1.obj.enable(); }
                            break;
                        case 2:
                            if (!App.parallax.slide2.isInited) {
                                App.parallax.slide2.obj = new Parallax(document.getElementById('main_slide_3'));
                                App.parallax.slide2.isInited = true;
                            } else { App.parallax.slide2.obj.enable(); }
                            break;
                    }
                }, 750);
            }
        }));
    }

    // Menu
    (function() {
        if (App.device.wide) {
            var timeout;
            var $menuAnimBg = $menu.find('.menu__bg');
            var deg = function() {
                var screenWidth = window.innerWidth;
                var hyp = Math.sqrt(Math.pow(screenWidth, 2) + Math.pow(275, 2));
                return 180 - 90 - Math.asin(screenWidth / hyp) * 180 / 3.14;
            };

            App.menu.afterOpen = function(d) {
                $menuAnimBg.addClass('is-visible').css({
                    '-webkit-transform': 'skewY(-'+deg()+'deg) translate3d(0, 500px, 0)',
                    'transform': 'skewY(-'+deg()+'deg) translate3d(0, 500px, 0)'
                })
                timeout = setTimeout(function() {
                    $menuAnimBg.addClass('is-full');
                    $menu.addClass('is-animation-ended');
                    d.resolve();
                }, 270);
                return d;
            };
            App.menu.beforeClose = function(d) {
                clearTimeout(timeout);
                $menu.removeClass('is-animation-ended');
                $menuAnimBg.removeClass('is-full').one('transitionend webkitTransitionEnd', function() {
                    $menuAnimBg.css('transform', '').removeClass('is-visible').one('transitionend webkitTransitionEnd', d.resolve);
                });
                return d;
            };
        }

        $('.js-open-menu-btn').on('click', App.menu.open);
        $('.js-close-menu-btn').on('click', App.menu.close);
    })();

    var jobsAcc = new App.Accordion('.js-jobs-accordion');
    var agencyAcc = new App.Accordion('.js-agency-accordion');
    if (App.device.wide) {
        jobsAcc.open(0);
    }
    agencyAcc.open(0);

    $window.on('scroll', function() {
        $floatMenu.toggleClass('is-active', $window.scrollTop() >= window.innerHeight);
        $headerTopBar.toggleClass('is-fixed', $window.scrollTop() >= window.innerHeight);
    });
    $('.js-btn-go-to-top').on('click', function() {
        $('html, body').animate({
            scrollTop: 0
        }, 200);
    });

    $header.find('.nav').clone(true).prependTo('.js-filter-content');
    $('.js-filter-close').on('click', App.filter.close);
    $('.js-filter-open').on('click', App.filter.open);

    initMap();

    /*
    $('.js-open-map').on('click', function() {
      $(this).closest('.js-contact-city').find('.map-container').addClass('is-visible');
    });
    $('.js-close-map').on('click', function() {
      $(this).closest('.js-contact-city').find('.map-container').removeClass('is-visible');
    });
    */

    $('.filter-d.category a').click(function(ev){
        ev.preventDefault();
        var currentClass = $(this).attr('data-filter');
        if(!$(this).hasClass('underline')){
            $('.filter-d a.underline').removeClass('underline');
            $(this).addClass('underline');
        }
        if($(this).hasClass('All')){
            $('.works-d__item').fadeIn();
        }else{
            $('.works-d__item.'+currentClass).fadeIn();
            $('.works-d__item').not('.'+currentClass).fadeOut();
        }
    });

    $('.filterNav').click(function(ev){
        ev.preventDefault();
        if(!$(this).hasClass('active')){
            $('.filterNav.active').removeClass('active');
            var filterClass = $(this).attr('data-filter');
            if(filterClass=='All'){
                $('.works__item').slideDown(150);
            }else{
                $('.works__item.'+filterClass).slideDown();
                $('.works__item').not('.'+filterClass).slideUp(150);
                $(this).addClass('active');
            }
        }else{
            $('.filterNav.active').removeClass('active');
            $('.works__item').slideDown(150);
        }
        $('html, body').animate({
            scrollTop: $('#works').offset().top
        }, 200);
    });

    if($('#worksPage').length){
        if (location.href.indexOf("#") > -1) {
            var filterHref = location.href;
            filterHref = filterHref.substr(filterHref.indexOf("#")+1);
            if(filterHref.indexOf('-') > 0){
                if(filterHref.indexOf('Brand') < 0){
                    $('.works__item.Brand').not('.Digital').not('.Product').slideUp(150);
                }else if(filterHref.indexOf('Digital') < 0){
                    $('.works__item.Digital').not('.Brand').not('.Product').slideUp(150);
                }else{
                    $('.works__item.Product').not('.Brand').not('.Digital').slideUp(150);
                }
            }else{
                filterHref = 'Brand';
                $('.works__item').not('.'+filterHref).slideUp(150);
                $('.filterNav[data-filter="'+filterHref+'"]').addClass('active');
            }
            $('html, body').animate({
                scrollTop: $('#works').offset().top
            }, 200);
        }
    }

    $('.openAachen').click(function(){
        $('.gmBoxContact').eq(0).addClass('opened');
    });
    $('.openMoscow').click(function(){
        $('.gmBoxContact').eq(1).addClass('opened');
    });

    $('.gmBoxContact .js-close-map').click(function(){
        $(this).parent().removeClass('opened');
    });

    $(window).bind('keydown', function(event) {
        if(event.keyCode === 27) {
            $('.gmBoxContact').removeClass('opened');
        }
    });

    $('.mapInfo').on('click', function() {
        $(this).next().toggleClass('opened');
        var scrollTo = 0;
        if($('#contactPage').length){
            var scrollParam = $(window).height() - $(window).width();
            scrollTo = $(this).next().offset().top - scrollParam;
        }else{
            scrollTo = $(this).find('h4').offset().top - 106;
        }
        $('html, body').animate({
            scrollTop: scrollTo
        }, 200);
    });

    $('.jobs-accordion a').click(function(ev){
        ev.stopImmediatePropagation();
    });

    if($('body').hasClass('pageId3') && !$('body').hasClass('mobile')){
        var imagesToPreload = [];
        $('.previewItem').each(function() {
            elementToTest = $(this);
            imagePath = elementToTest.attr('data-src');
            imagesToPreload.push(imagePath);
        });

        $.imgpreload(imagesToPreload,{
            each: function(){
                var imgPath = this.src;
                //var backgroundPath = imgPath.replace("http://elje-group.com",".");
                var elementToChange = $('.previewItem[data-src="'+imgPath+'"]');
                elementToChange.addClass('is-loaded');
            },
            all: function(){
            }
        });

    }
});
