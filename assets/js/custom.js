(function ($) {

  "use strict";

  // ── Preloader ─────────────────────────────────────────────
  // Usa #js-preloader (padrão da aplicação), não #preloader do template original
  $(window).on('load', function () {
    $('#js-preloader').addClass('loaded');
  });

  // ── Header scroll — só roda se .header-text existir na página ──
  $(window).scroll(function () {
    if (!$('.header-text').length) return;
    var scroll = $(window).scrollTop();
    var box    = $('.header-text').height();
    var header = $('header').height();
    if (scroll >= box - header) {
      $("header").addClass("background-header");
    } else {
      $("header").removeClass("background-header");
    }
  });

  // ── Isotope — só inicializa se .grid existir na página ────
  if ($('.grid').length) {
    var $grid = $(".grid").isotope({
      itemSelector: ".all",
      percentPosition: true,
      masonry: { columnWidth: ".all" }
    });

    $('.filters ul li').click(function () {
      $('.filters ul li').removeClass('active');
      $(this).addClass('active');
      $grid.isotope({ filter: $(this).attr('data-filter') });
    });
  }

  // ── Resize reload ──────────────────────────────────────────
  var width = $(window).width();
  $(window).resize(function () {
    if (width > 992 && $(window).width() < 992) { location.reload(); }
    else if (width < 992 && $(window).width() > 992) { location.reload(); }
  });

  // ── Tabs (naccs) ──────────────────────────────────────────
  $(document).on("click", ".naccs .menu div", function () {
    var numberIndex = $(this).index();
    if (!$(this).is("active")) {
      $(".naccs .menu div").removeClass("active");
      $(".naccs ul li").removeClass("active");
      $(this).addClass("active");
      $(".naccs ul").find("li:eq(" + numberIndex + ")").addClass("active");
      $(".naccs ul").height($(".naccs ul").find("li:eq(" + numberIndex + ")").innerHeight() + "px");
    }
  });

  // ── Owl Carousels — só inicializa se os elementos existirem ──
  if ($('.owl-features').length) {
    $('.owl-features').owlCarousel({
      items: 3, loop: true, dots: false, nav: true, autoplay: true, margin: 30,
      responsive: { 0: { items: 1 }, 800: { items: 2 }, 1000: { items: 3 }, 1800: { items: 4 } }
    });
  }
  if ($('.owl-collection').length) {
    $('.owl-collection').owlCarousel({
      items: 3, loop: true, dots: false, nav: true, autoplay: true, margin: 30,
      responsive: { 0: { items: 1 }, 800: { items: 2 }, 1000: { items: 3 } }
    });
  }
  if ($('.owl-banner').length) {
    $('.owl-banner').owlCarousel({
      items: 1, loop: true, dots: false, nav: true, autoplay: true, margin: 30,
      responsive: { 0: { items: 1 }, 600: { items: 1 }, 1000: { items: 1 } }
    });
  }

  // ── Menu mobile ───────────────────────────────────────────
  if ($('.menu-trigger').length) {
    $(".menu-trigger").on('click', function () {
      $(this).toggleClass('active');
      $('.header-area .nav').slideToggle(200);
    });
  }

  // ── Smooth scroll para âncoras ────────────────────────────
  $('.scroll-to-section a[href*=\\#]:not([href=\\#])').on('click', function () {
    if (location.pathname.replace(/^\//, '') == this.pathname.replace(/^\//, '') && location.hostname == this.hostname) {
      var target = $(this.hash);
      target = target.length ? target : $('[name=' + this.hash.slice(1) + ']');
      if (target.length) {
        if ($(window).width() < 991) {
          $('.menu-trigger').removeClass('active');
          $('.header-area .nav').slideUp(200);
        }
        $('html,body').animate({ scrollTop: (target.offset().top) - 80 }, 700);
        return false;
      }
    }
  });

  // ── onScroll: destaque de link ativo ──────────────────────
  // Guard: só ativa se houver links de âncora apontando para elementos existentes
  $(document).ready(function () {
    var hasAnchorLinks = $('.nav a[href^="#"]').filter(function () {
      var href = $(this).attr('href');
      return href && href.length > 1 && $(href).length > 0;
    }).length > 0;

    if (hasAnchorLinks) {
      $(document).on("scroll", onScroll);

      $('.scroll-to-section a[href^="#"]').on('click', function (e) {
        e.preventDefault();
        $(document).off("scroll");
        $('.scroll-to-section a').removeClass('active');
        $(this).addClass('active');
        var target = $(this.hash);
        $('html, body').stop().animate({
          scrollTop: (target.offset().top) - 79
        }, 500, 'swing', function () {
          window.location.hash = target;
          $(document).on("scroll", onScroll);
        });
      });
    }
  });

  function onScroll() {
    var scrollPos = $(document).scrollTop();
    $('.nav a').each(function () {
      var currLink   = $(this);
      var href       = currLink.attr("href");
      // Guard: ignora links que não são âncoras locais ou cujo elemento não existe
      if (!href || href.charAt(0) !== '#' || href.length <= 1) return;
      var refElement = $(href);
      if (!refElement.length) return;
      if (refElement.position().top <= scrollPos && refElement.position().top + refElement.height() > scrollPos) {
        $('.nav ul li a').removeClass("active");
        currLink.addClass("active");
      } else {
        currLink.removeClass("active");
      }
    });
  }

  // ── Submenus dropdown ─────────────────────────────────────
  var dropdownOpener = $('.main-nav ul.nav .has-sub > a');
  if (dropdownOpener.length) {
    dropdownOpener.each(function () {
      var _this = $(this);
      _this.on('tap click', function (e) {
        var thisItemParent = _this.parent('li');
        var thisItemParentSiblingsWithDrop = thisItemParent.siblings('.has-sub');
        if (thisItemParent.hasClass('has-sub')) {
          var submenu = thisItemParent.find('> ul.sub-menu');
          if (submenu.is(':visible')) {
            submenu.slideUp(450, 'easeInOutQuad');
            thisItemParent.removeClass('is-open-sub');
          } else {
            thisItemParent.addClass('is-open-sub');
            if (thisItemParentSiblingsWithDrop.length === 0) {
              thisItemParent.find('.sub-menu').slideUp(400, 'easeInOutQuad', function () {
                submenu.slideDown(250, 'easeInOutQuad');
              });
            } else {
              thisItemParent.siblings().removeClass('is-open-sub').find('.sub-menu').slideUp(250, 'easeInOutQuad', function () {
                submenu.slideDown(250, 'easeInOutQuad');
              });
            }
          }
        }
        e.preventDefault();
      });
    });
  }

})(window.jQuery);
