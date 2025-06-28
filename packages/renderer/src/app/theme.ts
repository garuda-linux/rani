import { flavors } from '@catppuccin/palette';
import type { Preset } from '@primeuix/themes/types';
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';
import Material from '@primeuix/themes/material';
import Nora from '@primeuix/themes/nora';
import Lara from '@primeuix/themes/lara';

const { latte, mocha, frappe, macchiato } = flavors;

const tokens = {
  semantic: {
    focusRing: {
      color: '{primary.color}',
    },
    primary: {
      50: '#fcfbff',
      100: '#f3eafd',
      200: '#e9d9fc',
      300: '#dfc8fa',
      400: '#d5b7f9',
      500: '#cba6f7',
      600: '#ad8dd2',
      700: '#8e74ad',
      800: '#705b88',
      900: '#514263',
      950: '#332a3e',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#f4f4f5',
          100: '#c9c9cd',
          200: '#9e9ea5',
          300: '#74747d',
          400: '#494956',
          500: '#1e1e2e',
          600: '#1a1a27',
          700: '#151520',
          800: '#111119',
          900: '#0c0c12',
          950: '#08080c',
        },
        primary: {
          color: latte.colors.mauve.hex,
          contrastColor: latte.colors.surface0.hex,
          hoverColor: latte.colors.maroon.hex,
          activeColor: latte.colors.flamingo.hex,
        },
        highlight: {
          background: '{content.background}',
          focusBackground: '{content.background}',
          color: latte.colors.red.hex,
          focusColor: latte.colors.maroon.hex,
        },
        mask: {
          background: latte.colors.surface0.hex + '99',
          color: '{surface.200}',
        },
        formField: {
          background: latte.colors.crust.hex + '88',
          disabledBackground: '{surface.700}',
          filledBackground: '{surface.800}',
          filledHoverBackground: '{surface.800}',
          filledFocusBackground: '{surface.800}',
          borderColor: '{surface.600}',
          hoverBorderColor: '{surface.500}',
          focusBorderColor: '{primary.color}',
          invalidBorderColor: latte.colors.peach.hex,
          color: latte.colors.text.hex,
          disabledColor: '{surface.400}',
          placeholderColor: '{surface.400}',
          invalidPlaceholderColor: latte.colors.maroon.hex,
          floatLabelColor: '{surface.400}',
          floatLabelFocusColor: '{primary.color}',
          floatLabelActiveColor: '{surface.400}',
          floatLabelInvalidColor: '{form.field.invalid.placeholder.color}',
          iconColor: '{surface.400}',
        },
        text: {
          color: latte.colors.text.hex,
          hoverColor: latte.colors.maroon.hex,
          mutedColor: latte.colors.surface1.hex,
          hoverMutedColor: latte.colors.surface0.hex,
        },
        content: {
          background: latte.colors.mantle.hex + '88',
          hoverBackground: '{surface.800}',
          borderColor: '{surface.700}',
          color: '{text.color}',
          hoverColor: '{text.hover.color}',
        },
        overlay: {
          select: {
            background: '{surface.900}',
            borderColor: '{surface.700}',
            color: '{text.color}',
          },
          popover: {
            background: '{surface.900}',
            borderColor: '{surface.700}',
            color: '{text.color}',
          },
          modal: {
            background: '{surface.900}',
            borderColor: '{surface.700}',
            color: '{text.color}',
          },
        },
        list: {
          option: {
            focusBackground: '{surface.800}',
            selectedBackground: '{highlight.background}',
            selectedFocusBackground: '{highlight.focus.background}',
            color: '{text.color}',
            focusColor: '{text.hover.color}',
            selectedColor: '{highlight.color}',
            selectedFocusColor: '{highlight.focus.color}',
            icon: {
              color: '{surface.500}',
              focusColor: '{surface.400}',
            },
          },
          optionGroup: {
            background: 'transparent',
            color: '{text.muted.color}',
          },
        },
        navigation: {
          item: {
            focusBackground: '{surface.800}',
            activeBackground: '{surface.800}',
            color: '{text.color}',
            focusColor: '{text.hover.color}',
            activeColor: '{text.hover.color}',
            icon: {
              color: '{surface.500}',
              focusColor: '{surface.400}',
              activeColor: '{surface.400}',
            },
          },
          submenuLabel: {
            background: 'transparent',
            color: '{text.muted.color}',
          },
          submenuIcon: {
            color: '{surface.500}',
            focusColor: '{surface.400}',
            activeColor: '{surface.400}',
          },
        },
      },
      dark: {
        surface: {
          0: '#ffffff',
          50: '#f4f4f5',
          100: '#c9c9cd',
          200: '#9e9ea5',
          300: '#74747d',
          400: '#494956',
          500: '#1e1e2e',
          600: '#1a1a27',
          700: '#151520',
          800: '#111119',
          900: '#0c0c12',
          950: '#08080c',
        },
        primary: {
          color: mocha.colors.mauve.hex,
          contrastColor: mocha.colors.surface0.hex,
          hoverColor: mocha.colors.maroon.hex,
          activeColor: mocha.colors.flamingo.hex,
        },
        highlight: {
          background: '{content.background}',
          focusBackground: '{content.background}',
          color: mocha.colors.red.hex,
          focusColor: mocha.colors.maroon.hex,
        },
        mask: {
          background: mocha.colors.surface0.hex + '99',
          color: '{surface.200}',
        },
        formField: {
          background: mocha.colors.crust.hex + '88',
          disabledBackground: '{surface.700}',
          filledBackground: '{surface.800}',
          filledHoverBackground: '{surface.800}',
          filledFocusBackground: '{surface.800}',
          borderColor: '{surface.600}',
          hoverBorderColor: '{surface.500}',
          focusBorderColor: '{primary.color}',
          invalidBorderColor: mocha.colors.peach.hex,
          color: mocha.colors.text.hex,
          disabledColor: '{surface.400}',
          placeholderColor: '{surface.400}',
          invalidPlaceholderColor: mocha.colors.maroon.hex,
          floatLabelColor: '{surface.400}',
          floatLabelFocusColor: '{primary.color}',
          floatLabelActiveColor: '{surface.400}',
          floatLabelInvalidColor: '{form.field.invalid.placeholder.color}',
          iconColor: '{surface.400}',
        },
        text: {
          color: mocha.colors.text.hex,
          hoverColor: mocha.colors.maroon.hex,
          mutedColor: mocha.colors.surface1.hex,
          hoverMutedColor: mocha.colors.surface0.hex,
        },
        content: {
          background: mocha.colors.mantle.hex + '99',
          hoverBackground: '{surface.800}',
          borderColor: '{surface.700}',
          color: '{text.color}',
          hoverColor: '{text.hover.color}',
        },
        overlay: {
          select: {
            background: '{surface.900}',
            borderColor: '{surface.700}',
            color: '{text.color}',
          },
          popover: {
            background: '{surface.900}',
            borderColor: '{surface.700}',
            color: '{text.color}',
          },
          modal: {
            background: '{surface.900}',
            borderColor: '{surface.700}',
            color: '{text.color}',
          },
        },
        list: {
          option: {
            focusBackground: '{surface.800}',
            selectedBackground: '{highlight.background}',
            selectedFocusBackground: '{highlight.focus.background}',
            color: '{text.color}',
            focusColor: '{text.hover.color}',
            selectedColor: '{highlight.color}',
            selectedFocusColor: '{highlight.focus.color}',
            icon: {
              color: '{surface.500}',
              focusColor: '{surface.400}',
            },
          },
          optionGroup: {
            background: 'transparent',
            color: '{text.muted.color}',
          },
        },
        navigation: {
          item: {
            focusBackground: '{surface.800}',
            activeBackground: '{surface.800}',
            color: '{text.color}',
            focusColor: '{text.hover.color}',
            activeColor: '{text.hover.color}',
            icon: {
              color: '{surface.500}',
              focusColor: '{surface.400}',
              activeColor: '{surface.400}',
            },
          },
          submenuLabel: {
            background: 'transparent',
            color: '{text.muted.color}',
          },
          submenuIcon: {
            color: '{surface.500}',
            focusColor: '{surface.400}',
            activeColor: '{surface.400}',
          },
        },
      },
    },
  },
  components: {
    card: {
      colorScheme: {
        light: {
          background: latte.colors.mantle.hex + '88',
        },
        dark: {
          background: mocha.colors.mantle.hex + '88',
        },
      },
    },
    checkbox: {
      colorScheme: {
        light: {
          border: {
            color: latte.colors.mauve.hex,
          },
          background: latte.colors.crust.hex,
          disabled: {
            background: latte.colors.base.hex,
          },
          hover: {
            border: {
              color: latte.colors.maroon.hex,
            },
          },
        },
        dark: {
          border: {
            color: mocha.colors.mauve.hex,
          },
          background: mocha.colors.crust.hex,
          disabled: {
            background: mocha.colors.base.hex,
          },
          hover: {
            border: {
              color: mocha.colors.maroon.hex,
            },
          },
        },
      },
    },
    drawer: {
      colorScheme: {
        light: {
          background: latte.colors.mantle.hex,
        },
        dark: {
          background: mocha.colors.mantle.hex,
        },
      },
    },
    inputtext: {
      colorScheme: {
        light: {
          color: latte.colors.text.hex,
          background: latte.colors.crust.hex + '88',
          border: {
            color: latte.colors.surface0.hex,
          },
        },
        dark: {
          color: mocha.colors.text.hex,
          background: mocha.colors.crust.hex + '88',
          border: {
            color: mocha.colors.surface0.hex,
          },
        },
      },
    },
    button: {
      colorScheme: {
        light: {
          secondary: {
            background: latte.colors.crust.hex + '88',
            border: {
              color: latte.colors.surface0.hex,
            },
            hover: {
              color: latte.colors.mauve.hex,
              border: {
                color: latte.colors.crust.hex,
              },
            },
          },
        },
        dark: {
          secondary: {
            background: mocha.colors.crust.hex + '88',
            border: {
              color: mocha.colors.surface0.hex,
            },
            color: mocha.colors.text.hex,
            hover: {
              color: mocha.colors.mauve.hex,
              border: {
                color: mocha.colors.crust.hex,
              },
            },
          },
        },
      },
    },
    panel: {
      colorScheme: {
        light: {
          background: latte.colors.base.hex + '99',
          border: {
            color: latte.colors.crust.hex,
            radius: '0.7rem',
          },
        },
        dark: {
          background: mocha.colors.base.hex + '99',
          border: {
            color: mocha.colors.crust.hex,
            radius: '0.7rem',
          },
        },
      },
    },
    dialog: {
      colorScheme: {
        light: {
          background: latte.colors.base.hex,
          border: {
            color: latte.colors.crust.hex,
          },
        },
        dark: {
          background: mocha.colors.base.hex,
          border: {
            color: mocha.colors.crust.hex,
          },
        },
      },
    },
    divider: {
      colorScheme: {
        light: {
          border: {
            color: latte.colors.surface0.hex,
          },
        },
        dark: {
          border: {
            color: mocha.colors.surface0.hex,
          },
        },
      },
    },
    menubar: {
      colorScheme: {
        light: {
          item: {
            color: latte.colors.mauve.hex,
            active: {
              color: latte.colors.maroon.hex,
            },
            focus: {
              color: latte.colors.maroon.hex,
              background: latte.colors.crust.hex,
            },
            icon: {
              color: latte.colors.maroon.hex,
              focus: {
                color: latte.colors.mauve.hex,
              },
            },
            submenu: {
              icon: {
                color: latte.colors.text.hex,
              },
            },
          },
        },
        dark: {
          item: {
            color: mocha.colors.mauve.hex,
            active: {
              color: mocha.colors.maroon.hex,
            },
            focus: {
              color: mocha.colors.maroon.hex,
              background: mocha.colors.crust.hex,
            },
            icon: {
              color: mocha.colors.maroon.hex,
              focus: {
                color: mocha.colors.mauve.hex,
              },
            },
            submenu: {
              icon: {
                color: mocha.colors.text.hex,
                active: {
                  color: mocha.colors.maroon.hex,
                },
              },
            },
          },
        },
      },
    },
    popover: {
      colorscheme: {
        light: {
          background: latte.colors.crust.hex,
          arrow: {
            offset: '9.8rem',
          },
        },
        dark: {
          background: mocha.colors.crust.hex,
          arrow: {
            offset: '9.8rem',
          },
        },
      },
    },
    progressspinner: {
      colorScheme: {
        light: {
          color: {
            1: latte.colors.maroon.hex,
            2: latte.colors.flamingo.hex,
            3: latte.colors.green.hex,
            4: latte.colors.yellow.hex,
          },
        },
        dark: {
          color: {
            1: mocha.colors.maroon.hex,
            2: mocha.colors.flamingo.hex,
            3: mocha.colors.green.hex,
            4: mocha.colors.yellow.hex,
          },
        },
      },
    },
    select: {
      colorScheme: {
        light: {
          color: latte.colors.text.hex,
          disabled: {
            background: latte.colors.surface0.hex,
          },
          overlay: {
            background: latte.colors.crust.hex,
          },
          option: {
            focus: {
              background: latte.colors.base.hex,
            },
            selected: {
              background: latte.colors.surface0.hex,
            },
          },
        },
        dark: {
          color: mocha.colors.text.hex,
          disabled: {
            background: mocha.colors.surface0.hex,
          },
          overlay: {
            background: mocha.colors.crust.hex,
          },
          option: {
            focus: {
              background: mocha.colors.base.hex,
            },
            selected: {
              background: mocha.colors.surface0.hex,
            },
          },
        },
      },
    },
    datatable: {
      colorScheme: {
        light: {
          header: {
            cell: {
              hover: {
                background: latte.colors.surface0.hex,
              },
            },
          },
          row: {
            hover: {
              background: latte.colors.surface0.hex,
            },
          },
        },
        dark: {
          header: {
            cell: {
              hover: {
                background: mocha.colors.surface0.hex,
              },
            },
          },
          row: {
            hover: {
              background: mocha.colors.surface0.hex,
            },
          },
        },
      },
    },
    tooltip: {
      colorScheme: {
        light: {
          background: latte.colors.crust.hex,
        },
        dark: {
          background: mocha.colors.crust.hex,
        },
      },
    },
  },
};

const tokensAlt = {
  semantic: {
    focusRing: {
      color: '{primary.color}',
    },
    primary: {
      50: '#fcfbff',
      100: '#f3eafd',
      200: '#e9d9fc',
      300: '#dfc8fa',
      400: '#d5b7f9',
      500: '#cba6f7',
      600: '#ad8dd2',
      700: '#8e74ad',
      800: '#705b88',
      900: '#514263',
      950: '#332a3e',
    },
    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#f5f5f6',
          100: '#d0ced3',
          200: '#aaa8af',
          300: '#85818c',
          400: '#5f5b69',
          500: '#3a3446',
          600: '#312c3c',
          700: '#292431',
          800: '#201d27',
          900: '#17151c',
          950: '#0f0d12',
        },
        primary: {
          color: frappe.colors.mauve.hex,
          contrastColor: frappe.colors.surface0.hex,
          hoverColor: frappe.colors.maroon.hex,
          activeColor: frappe.colors.flamingo.hex,
        },
        highlight: {
          background: '{content.background}',
          focusBackground: '{content.background}',
          color: frappe.colors.red.hex,
          focusColor: frappe.colors.maroon.hex,
        },
        mask: {
          background: frappe.colors.surface0.hex + '99',
          color: '{surface.200}',
        },
        formField: {
          background: frappe.colors.crust.hex + '88',
          disabledBackground: '{surface.700}',
          filledBackground: '{surface.800}',
          filledHoverBackground: '{surface.800}',
          filledFocusBackground: '{surface.800}',
          borderColor: '{surface.600}',
          hoverBorderColor: '{surface.500}',
          focusBorderColor: '{primary.color}',
          invalidBorderColor: frappe.colors.peach.hex,
          color: frappe.colors.text.hex,
          disabledColor: '{surface.400}',
          placeholderColor: '{surface.400}',
          invalidPlaceholderColor: frappe.colors.maroon.hex,
          floatLabelColor: '{surface.400}',
          floatLabelFocusColor: '{primary.color}',
          floatLabelActiveColor: '{surface.400}',
          floatLabelInvalidColor: '{form.field.invalid.placeholder.color}',
          iconColor: '{surface.400}',
        },
        text: {
          color: frappe.colors.text.hex,
          hoverColor: frappe.colors.maroon.hex,
          mutedColor: frappe.colors.surface1.hex,
          hoverMutedColor: frappe.colors.surface0.hex,
        },
        content: {
          background: frappe.colors.surface0.hex + '99',
          hoverBackground: '{surface.800}',
          borderColor: '{surface.700}',
          color: '{text.color}',
          hoverColor: '{text.hover.color}',
        },
        overlay: {
          select: {
            background: '{surface.900}',
            borderColor: '{surface.700}',
            color: '{text.color}',
          },
          popover: {
            background: '{surface.900}',
            borderColor: '{surface.700}',
            color: '{text.color}',
          },
          modal: {
            background: '{surface.900}',
            borderColor: '{surface.700}',
            color: '{text.color}',
          },
        },
        list: {
          option: {
            focusBackground: '{surface.800}',
            selectedBackground: '{highlight.background}',
            selectedFocusBackground: '{highlight.focus.background}',
            color: '{text.color}',
            focusColor: '{text.hover.color}',
            selectedColor: '{highlight.color}',
            selectedFocusColor: '{highlight.focus.color}',
            icon: {
              color: '{surface.500}',
              focusColor: '{surface.400}',
            },
          },
          optionGroup: {
            background: 'transparent',
            color: '{text.muted.color}',
          },
        },
        navigation: {
          item: {
            focusBackground: '{surface.800}',
            activeBackground: '{surface.800}',
            color: '{text.color}',
            focusColor: '{text.hover.color}',
            activeColor: '{text.hover.color}',
            icon: {
              color: '{surface.500}',
              focusColor: '{surface.400}',
              activeColor: '{surface.400}',
            },
          },
          submenuLabel: {
            background: 'transparent',
            color: '{text.muted.color}',
          },
          submenuIcon: {
            color: '{surface.500}',
            focusColor: '{surface.400}',
            activeColor: '{surface.400}',
          },
        },
      },
      dark: {
        surface: {
          0: '#ffffff',
          50: '#f4f4f5',
          100: '#cacbcd',
          200: '#a1a2a6',
          300: '#77797f',
          400: '#4e5057',
          500: '#242730',
          600: '#1f2129',
          700: '#191b22',
          800: '#14151a',
          900: '#0e1013',
          950: '#090a0c',
        },
        primary: {
          color: macchiato.colors.mauve.hex,
          contrastColor: macchiato.colors.surface0.hex,
          hoverColor: macchiato.colors.maroon.hex,
          activeColor: macchiato.colors.flamingo.hex,
        },
        highlight: {
          background: '{content.background}',
          focusBackground: '{content.background}',
          color: macchiato.colors.red.hex,
          focusColor: macchiato.colors.maroon.hex,
        },
        mask: {
          background: macchiato.colors.surface0.hex + '99',
          color: '{surface.200}',
        },
        formField: {
          background: macchiato.colors.crust.hex + '88',
          disabledBackground: '{surface.700}',
          filledBackground: '{surface.800}',
          filledHoverBackground: '{surface.800}',
          filledFocusBackground: '{surface.800}',
          borderColor: '{surface.600}',
          hoverBorderColor: '{surface.500}',
          focusBorderColor: '{primary.color}',
          invalidBorderColor: macchiato.colors.peach.hex,
          color: macchiato.colors.text.hex,
          disabledColor: '{surface.400}',
          placeholderColor: '{surface.400}',
          invalidPlaceholderColor: macchiato.colors.maroon.hex,
          floatLabelColor: '{surface.400}',
          floatLabelFocusColor: '{primary.color}',
          floatLabelActiveColor: '{surface.400}',
          floatLabelInvalidColor: '{form.field.invalid.placeholder.color}',
          iconColor: '{surface.400}',
        },
        text: {
          color: macchiato.colors.text.hex,
          hoverColor: macchiato.colors.maroon.hex,
          mutedColor: macchiato.colors.surface1.hex,
          hoverMutedColor: macchiato.colors.surface0.hex,
        },
        content: {
          background: macchiato.colors.surface0.hex + '99',
          hoverBackground: '{surface.800}',
          borderColor: '{surface.700}',
          color: '{text.color}',
          hoverColor: '{text.hover.color}',
        },
        overlay: {
          select: {
            background: '{surface.900}',
            borderColor: '{surface.700}',
            color: '{text.color}',
          },
          popover: {
            background: '{surface.900}',
            borderColor: '{surface.700}',
            color: '{text.color}',
          },
          modal: {
            background: '{surface.900}',
            borderColor: '{surface.700}',
            color: '{text.color}',
          },
        },
        list: {
          option: {
            focusBackground: '{surface.800}',
            selectedBackground: '{highlight.background}',
            selectedFocusBackground: '{highlight.focus.background}',
            color: '{text.color}',
            focusColor: '{text.hover.color}',
            selectedColor: '{highlight.color}',
            selectedFocusColor: '{highlight.focus.color}',
            icon: {
              color: '{surface.500}',
              focusColor: '{surface.400}',
            },
          },
          optionGroup: {
            background: 'transparent',
            color: '{text.muted.color}',
          },
        },
        navigation: {
          item: {
            focusBackground: '{surface.800}',
            activeBackground: '{surface.800}',
            color: '{text.color}',
            focusColor: '{text.hover.color}',
            activeColor: '{text.hover.color}',
            icon: {
              color: '{surface.500}',
              focusColor: '{surface.400}',
              activeColor: '{surface.400}',
            },
          },
          submenuLabel: {
            background: 'transparent',
            color: '{text.muted.color}',
          },
          submenuIcon: {
            color: '{surface.500}',
            focusColor: '{surface.400}',
            activeColor: '{surface.400}',
          },
        },
      },
    },
  },
  components: {
    card: {
      colorScheme: {
        light: {
          background: frappe.colors.mantle.hex + '88',
        },
        dark: {
          background: macchiato.colors.mantle.hex + '88',
        },
      },
    },
    checkbox: {
      colorScheme: {
        light: {
          border: {
            color: frappe.colors.mauve.hex,
          },
          background: frappe.colors.crust.hex,
          disabled: {
            background: frappe.colors.base.hex,
          },
          hover: {
            border: {
              color: frappe.colors.maroon.hex,
            },
          },
        },
        dark: {
          border: {
            color: macchiato.colors.mauve.hex,
          },
          background: macchiato.colors.crust.hex,
          disabled: {
            background: macchiato.colors.base.hex,
          },
          hover: {
            border: {
              color: macchiato.colors.maroon.hex,
            },
          },
        },
      },
    },
    drawer: {
      colorScheme: {
        light: {
          background: frappe.colors.mantle.hex,
        },
        dark: {
          background: macchiato.colors.mantle.hex,
        },
      },
    },
    inputtext: {
      colorScheme: {
        light: {
          color: frappe.colors.text.hex,
          background: frappe.colors.crust.hex + '88',
          border: {
            color: frappe.colors.surface0.hex,
          },
        },
        dark: {
          color: macchiato.colors.text.hex,
          background: macchiato.colors.crust.hex + '88',
          border: {
            color: macchiato.colors.surface0.hex,
          },
        },
      },
    },
    button: {
      colorScheme: {
        light: {
          secondary: {
            background: frappe.colors.crust.hex + '88',
            border: {
              color: frappe.colors.surface0.hex,
            },
            hover: {
              color: frappe.colors.mauve.hex,
              border: {
                color: frappe.colors.crust.hex,
              },
            },
          },
        },
        dark: {
          secondary: {
            background: macchiato.colors.crust.hex + '88',
            border: {
              color: macchiato.colors.surface0.hex,
            },
            color: macchiato.colors.text.hex,
            hover: {
              color: macchiato.colors.mauve.hex,
              border: {
                color: macchiato.colors.crust.hex,
              },
            },
          },
        },
      },
    },
    panel: {
      colorScheme: {
        light: {
          background: frappe.colors.base.hex + '99',
          border: {
            color: frappe.colors.crust.hex,
            radius: '0.7rem',
          },
        },
        dark: {
          background: macchiato.colors.base.hex + '99',
          border: {
            color: macchiato.colors.crust.hex,
            radius: '0.7rem',
          },
        },
      },
    },
    dialog: {
      colorScheme: {
        light: {
          background: frappe.colors.base.hex,
          border: {
            color: frappe.colors.crust.hex,
          },
        },
        dark: {
          background: macchiato.colors.base.hex,
          border: {
            color: macchiato.colors.crust.hex,
          },
        },
      },
    },
    divider: {
      colorScheme: {
        light: {
          border: {
            color: frappe.colors.surface0.hex,
          },
        },
        dark: {
          border: {
            color: macchiato.colors.surface0.hex,
          },
        },
      },
    },
    menubar: {
      colorScheme: {
        light: {
          background: frappe.colors.crust.hex,
          color: frappe.colors.mauve.hex,
          item: {
            color: frappe.colors.mauve.hex,
            active: {
              color: frappe.colors.maroon.hex,
            },
            focus: {
              color: frappe.colors.maroon.hex,
              background: frappe.colors.crust.hex,
            },
            icon: {
              color: frappe.colors.maroon.hex,
              focus: {
                color: frappe.colors.mauve.hex,
              },
            },
            submenu: {
              icon: {
                color: frappe.colors.text.hex,
              },
            },
          },
        },
        dark: {
          item: {
            color: macchiato.colors.mauve.hex,
            active: {
              color: macchiato.colors.maroon.hex,
            },
            focus: {
              color: macchiato.colors.maroon.hex,
              background: macchiato.colors.crust.hex,
            },
            icon: {
              color: macchiato.colors.maroon.hex,
              focus: {
                color: macchiato.colors.mauve.hex,
              },
            },
            submenu: {
              icon: {
                color: macchiato.colors.text.hex,
                active: {
                  color: macchiato.colors.maroon.hex,
                },
              },
            },
          },
        },
      },
    },
    popover: {
      colorscheme: {
        light: {
          background: frappe.colors.crust.hex,
          arrow: {
            offset: '9.8rem',
          },
        },
        dark: {
          background: macchiato.colors.crust.hex,
          arrow: {
            offset: '9.8rem',
          },
        },
      },
    },
    progressspinner: {
      colorScheme: {
        light: {
          color: {
            1: frappe.colors.maroon.hex,
            2: frappe.colors.flamingo.hex,
            3: frappe.colors.green.hex,
            4: frappe.colors.yellow.hex,
          },
        },
        dark: {
          color: {
            1: macchiato.colors.maroon.hex,
            2: macchiato.colors.flamingo.hex,
            3: macchiato.colors.green.hex,
            4: macchiato.colors.yellow.hex,
          },
        },
      },
    },
    select: {
      colorScheme: {
        light: {
          color: frappe.colors.text.hex,
          disabled: {
            background: frappe.colors.surface0.hex,
          },
          overlay: {
            background: frappe.colors.crust.hex,
          },
          option: {
            focus: {
              background: frappe.colors.base.hex,
            },
            selected: {
              background: frappe.colors.surface0.hex,
            },
          },
        },
        dark: {
          color: macchiato.colors.text.hex,
          disabled: {
            background: macchiato.colors.surface0.hex,
          },
          overlay: {
            background: macchiato.colors.crust.hex,
          },
          option: {
            focus: {
              background: macchiato.colors.base.hex,
            },
            selected: {
              background: macchiato.colors.surface0.hex,
            },
          },
        },
      },
    },
    datatable: {
      colorScheme: {
        light: {
          header: {
            cell: {
              hover: {
                background: frappe.colors.surface0.hex,
              },
            },
          },
          row: {
            hover: {
              background: frappe.colors.surface0.hex,
            },
          },
        },
        dark: {
          header: {
            cell: {
              hover: {
                background: macchiato.colors.surface0.hex,
              },
            },
          },
          row: {
            hover: {
              background: macchiato.colors.surface0.hex,
            },
          },
        },
      },
    },
    tooltip: {
      colorScheme: {
        light: {
          background: frappe.colors.crust.hex,
        },
        dark: {
          background: macchiato.colors.crust.hex,
        },
      },
    },
  },
};

const tokensDr460nized: Preset = {
  semantic: {
    transitionDuration: '0.2s',
    focusRing: {
      width: '1px',
      style: 'solid',
      color: '{primary.color}',
      offset: '2px',
      shadow: 'none',
    },
    disabledOpacity: '0.6',
    iconSize: '1rem',
    anchorGutter: '2px',
    primary: {
      '50': '#fcf3fd',
      '100': '#f1c5f4',
      '200': '#e697ec',
      '300': '#db6ae3',
      '400': '#d03cdb',
      '500': '#c50ed2',
      '600': '#a70cb3',
      '700': '#8a0a93',
      '800': '#6c0874',
      '900': '#4f0654',
      '950': '#310435',
    },
    formField: {
      paddingX: '0.75rem',
      paddingY: '0.5rem',
      sm: {
        fontSize: '0.875rem',
        paddingX: '0.625rem',
        paddingY: '0.375rem',
      },
      lg: {
        fontSize: '1.125rem',
        paddingX: '0.875rem',
        paddingY: '0.625rem',
      },
      borderRadius: '{border.radius.md}',
      focusRing: {
        width: '0',
        style: 'none',
        color: 'transparent',
        offset: '0',
        shadow: 'none',
      },
      transitionDuration: '{transition.duration}',
    },
    list: {
      padding: '0.25rem 0.25rem',
      gap: '2px',
      header: {
        padding: '0.5rem 1rem 0.25rem 1rem',
      },
      option: {
        padding: '0.5rem 0.75rem',
        borderRadius: '{border.radius.sm}',
      },
      optionGroup: {
        padding: '0.5rem 0.75rem',
        fontWeight: '600',
      },
    },
    content: {
      borderRadius: '{border.radius.md}',
    },
    mask: {
      transitionDuration: '0.15s',
    },
    navigation: {
      list: {
        padding: '0.25rem 0.25rem',
        gap: '2px',
      },
      item: {
        padding: '0.5rem 0.75rem',
        borderRadius: '{border.radius.sm}',
        gap: '0.5rem',
      },
      submenuLabel: {
        padding: '0.5rem 0.75rem',
        fontWeight: '600',
      },
      submenuIcon: {
        size: '0.875rem',
      },
    },
    overlay: {
      select: {
        borderRadius: '{border.radius.md}',
        shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      },
      popover: {
        borderRadius: '{border.radius.md}',
        padding: '0.75rem',
        shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      },
      modal: {
        borderRadius: '{border.radius.xl}',
        padding: '1.25rem',
        shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      },
      navigation: {
        shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
      },
    },
    colorScheme: {
      light: {
        surface: {
          '0': '#ffffff',
          '50': '{slate.50}',
          '100': '{slate.100}',
          '200': '{slate.200}',
          '300': '{slate.300}',
          '400': '{slate.400}',
          '500': '{slate.500}',
          '600': '{slate.600}',
          '700': '{slate.700}',
          '800': '{slate.800}',
          '900': '{slate.900}',
          '950': '{slate.950}',
        },
        primary: {
          color: '{primary.500}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.600}',
          activeColor: '{primary.700}',
        },
        highlight: {
          background: '{primary.50}',
          focusBackground: '{primary.100}',
          color: '{primary.700}',
          focusColor: '{primary.800}',
        },
        mask: {
          background: 'rgba(0,0,0,0.4)',
          color: '{surface.200}',
        },
        formField: {
          background: '{surface.0}',
          disabledBackground: '{surface.200}',
          filledBackground: '{surface.300}',
          filledHoverBackground: '{surface.50}',
          filledFocusBackground: '{surface.50}',
          borderColor: '{surface.500}',
          hoverBorderColor: '{surface.400}',
          focusBorderColor: '{primary.color}',
          invalidBorderColor: '{red.400}',
          color: '{surface.700}',
          disabledColor: '{surface.500}',
          placeholderColor: '{surface.500}',
          invalidPlaceholderColor: '{red.600}',
          floatLabelColor: '{surface.500}',
          floatLabelFocusColor: '{primary.600}',
          floatLabelActiveColor: '{surface.500}',
          floatLabelInvalidColor: '{form.field.invalid.placeholder.color}',
          iconColor: '{surface.400}',
          shadow: '0 0 #0000, 0 0 #0000, 0 1px 2px 0 rgba(18, 18, 23, 0.05)',
        },
        text: {
          color: '{surface.700}',
          hoverColor: '{surface.800}',
          mutedColor: '{surface.500}',
          hoverMutedColor: '{surface.600}',
        },
        content: {
          background: '{surface.200}',
          hoverBackground: '{surface.100}',
          borderColor: '{surface.200}',
          color: '{text.color}',
          hoverColor: '{text.hover.color}',
        },
        overlay: {
          select: {
            background: '{surface.0}',
            borderColor: '{surface.200}',
            color: '{text.color}',
          },
          popover: {
            background: '{surface.0}',
            borderColor: '{surface.200}',
            color: '{text.color}',
          },
          modal: {
            background: '{surface.0}',
            borderColor: '{surface.200}',
            color: '{text.color}',
          },
        },
        list: {
          option: {
            focusBackground: '{surface.100}',
            selectedBackground: '{highlight.background}',
            selectedFocusBackground: '{highlight.focus.background}',
            color: '{text.color}',
            focusColor: '{text.hover.color}',
            selectedColor: '{highlight.color}',
            selectedFocusColor: '{highlight.focus.color}',
            icon: {
              color: '{surface.400}',
              focusColor: '{surface.500}',
            },
          },
          optionGroup: {
            background: 'transparent',
            color: '{text.muted.color}',
          },
        },
        navigation: {
          item: {
            focusBackground: '{surface.100}',
            activeBackground: '{surface.100}',
            color: '{text.color}',
            focusColor: '{text.hover.color}',
            activeColor: '{text.hover.color}',
            icon: {
              color: '{surface.400}',
              focusColor: '{surface.500}',
              activeColor: '{surface.500}',
            },
          },
          submenuLabel: {
            background: 'transparent',
            color: '{text.muted.color}',
          },
          submenuIcon: {
            color: '{surface.400}',
            focusColor: '{surface.500}',
            activeColor: '{surface.500}',
          },
        },
      },
      dark: {
        surface: {
          '0': '#ffffff',
          '50': '#f3f4f4',
          '100': '#c7c8cb',
          '200': '#9b9ca1',
          '300': '#6f7078',
          '400': '#42454e',
          '500': '#161925',
          '600': '#13151f',
          '700': '#0f121a',
          '800': '#0c0e14',
          '900': '#090a0f',
          '950': '#060609',
        },
        primary: {
          color: '{primary.400}',
          contrastColor: '{surface.900}',
          hoverColor: '{primary.200}',
          activeColor: '{primary.100}',
        },
        highlight: {
          background: 'color-mix(in srgb, {primary.400}, transparent 84%)',
          focusBackground: 'color-mix(in srgb, {primary.400}, transparent 76%)',
          color: 'rgba(255,255,255,.87)',
          focusColor: 'rgba(255,255,255,.87)',
        },
        mask: {
          background: 'rgba(0,0,0,0.6)',
          color: '{surface.200}',
        },
        formField: {
          background: '{surface.950}',
          disabledBackground: '{surface.700}',
          filledBackground: '{surface.800}',
          filledHoverBackground: '{surface.800}',
          filledFocusBackground: '{surface.800}',
          borderColor: '#353946',
          hoverBorderColor: '{surface.500}',
          focusBorderColor: '{primary.color}',
          invalidBorderColor: '#ff6a00',
          color: '{surface.0}',
          disabledColor: '{surface.400}',
          placeholderColor: '{surface.400}',
          invalidPlaceholderColor: '#ed254e',
          floatLabelColor: '{surface.400}',
          floatLabelFocusColor: '{primary.color}',
          floatLabelActiveColor: '{surface.400}',
          floatLabelInvalidColor: '#ff6a00',
          iconColor: '{surface.400}',
          shadow: '0 0 #0000, 0 0 #0000, 0 1px 2px 0 rgba(18, 18, 23, 0.05)',
        },
        text: {
          color: '{surface.0}',
          hoverColor: '{surface.0}',
          mutedColor: '{surface.400}',
          hoverMutedColor: '{surface.300}',
        },
        content: {
          background: '{surface.900}',
          hoverBackground: '{surface.800}',
          borderColor: '{surface.700}',
          color: '{text.color}',
          hoverColor: '{text.hover.color}',
        },
        overlay: {
          select: {
            background: '{surface.900}',
            borderColor: '{surface.700}',
            color: '{text.color}',
          },
          popover: {
            background: '{surface.900}',
            borderColor: '{surface.700}',
            color: '{text.color}',
          },
          modal: {
            background: '{surface.900}',
            borderColor: '{surface.700}',
            color: '{text.color}',
          },
        },
        list: {
          option: {
            focusBackground: '{surface.800}',
            selectedBackground: '{highlight.background}',
            selectedFocusBackground: '{highlight.focus.background}',
            color: '{text.color}',
            focusColor: '{text.hover.color}',
            selectedColor: '{highlight.color}',
            selectedFocusColor: '{highlight.focus.color}',
            icon: {
              color: '{surface.500}',
              focusColor: '{surface.400}',
            },
          },
          optionGroup: {
            background: 'transparent',
            color: '{text.muted.color}',
          },
        },
        navigation: {
          item: {
            focusBackground: '{surface.800}',
            activeBackground: '{surface.800}',
            color: '{text.color}',
            focusColor: '{text.hover.color}',
            activeColor: '{text.hover.color}',
            icon: {
              color: '{surface.500}',
              focusColor: '{surface.400}',
              activeColor: '{surface.400}',
            },
          },
          submenuLabel: {
            background: 'transparent',
            color: '{text.muted.color}',
          },
          submenuIcon: {
            color: '{surface.500}',
            focusColor: '{surface.400}',
            activeColor: '{surface.400}',
          },
        },
      },
    },
  },
};

export const CatppuccinScrollBars = {
  primary: {
    light: `${latte.colors.surface0.hex} rgba(230, 233, 239, 0.5)`,
    dark: `${mocha.colors.surface0.hex} rgba(24, 24, 37, 0.5)`,
  },
  alt: {
    light: `${frappe.colors.surface0.hex} rgba(48, 52, 70, 0.5)`,
    dark: `${macchiato.colors.surface0.hex} rgba(36, 39, 58, 0.5)`,
  },
};
export const CatppuccinBackgroundColors = {
  primary: {
    light: latte.colors.base.hex,
    lightSelected: latte.colors.surface1.hex,
    dark: mocha.colors.base.hex,
    darkSelected: mocha.colors.surface1.hex,
  },
  alt: {
    light: frappe.colors.base.hex,
    lightSelected: frappe.colors.surface1.hex,
    dark: macchiato.colors.base.hex,
    darkSelected: macchiato.colors.surface1.hex,
  },
};

export const CatppuccinAura = definePreset(Aura, tokens as Preset);
export const CatppuccinNora = definePreset(Nora, tokens as Preset);
export const CatppuccinMaterial = definePreset(Material, tokens as Preset);
export const CatppuccinLara = definePreset(Lara, tokens as Preset);

export const CatppuccinAuraAlt = definePreset(Aura, tokensAlt as Preset);
export const CatppuccinNoraAlt = definePreset(Nora, tokensAlt as Preset);
export const CatppuccinMaterialAlt = definePreset(Material, tokensAlt as Preset);
export const CatppuccinLaraAlt = definePreset(Lara, tokensAlt as Preset);

export const Dr460nizedAura = definePreset(Aura, tokensDr460nized);
export const Dr460nizedNora = definePreset(Nora, tokensDr460nized);
export const Dr460nizedLara = definePreset(Lara, tokensDr460nized);
export const Dr460nizedMaterial = definePreset(Material, tokensDr460nized);

export const themes: AppThemes = {
  'Catppuccin Mocha/Latte Aura': CatppuccinAura,
  'Catppuccin Mocha/Latte Nora': CatppuccinNora,
  'Catppuccin Mocha/Latte Material': CatppuccinMaterial,
  'Catppuccin Mocha/Latte Lara': CatppuccinLara,
  'Catppuccin Macchiato/Frappe Aura': CatppuccinAuraAlt,
  'Catppuccin Macchiato/Frappe Nora': CatppuccinNoraAlt,
  'Catppuccin Macchiato/Frappe Material': CatppuccinMaterialAlt,
  'Catppuccin Macchiato/Frappe Lara': CatppuccinLaraAlt,
  'Dr460nized Aura': Dr460nizedAura,
  'Dr460nized Nora': Dr460nizedNora,
  'Dr460nized Material': Dr460nizedMaterial,
  'Dr460nized Lara': Dr460nizedLara,
  'Custom Themedesigner': {},
};

export type AppTheme =
  | 'Catppuccin Mocha/Latte Aura'
  | 'Catppuccin Mocha/Latte Nora'
  | 'Catppuccin Mocha/Latte Material'
  | 'Catppuccin Mocha/Latte Lara'
  | 'Catppuccin Macchiato/Frappe Aura'
  | 'Catppuccin Macchiato/Frappe Nora'
  | 'Catppuccin Macchiato/Frappe Material'
  | 'Catppuccin Macchiato/Frappe Lara'
  | 'Dr460nized Aura'
  | 'Dr460nized Nora'
  | 'Dr460nized Material'
  | 'Dr460nized Lara'
  | 'Custom Themedesigner';

export type AppThemes = Record<string, Preset>;

export const CatppuccinXtermJs = {
  light: {
    background: latte.colors.base.hex,
    black: latte.colors.surface1.hex,
    blue: latte.colors.blue.hex,
    brightBlack: latte.colors.surface1.hex,
    brightBlue: latte.colors.blue.hex,
    brightCyan: latte.colors.flamingo.hex,
    brightGreen: latte.colors.green.hex,
    brightMagenta: latte.colors.maroon.hex,
    brightRed: latte.colors.red.hex,
    brightWhite: latte.colors.text.hex,
    brightYellow: latte.colors.yellow.hex,
    cursor: latte.colors.text.hex,
    cursorAccent: latte.colors.text.hex,
    cyan: latte.colors.flamingo.hex,
    foreground: latte.colors.text.hex,
    green: latte.colors.green.hex,
    magenta: latte.colors.maroon.hex,
    red: latte.colors.red.hex,
    white: latte.colors.text.hex,
    yellow: latte.colors.yellow.hex,
  },
  dark: {
    background: mocha.colors.base.hex,
    black: mocha.colors.surface1.hex,
    blue: mocha.colors.blue.hex,
    brightBlack: mocha.colors.surface1.hex,
    brightBlue: mocha.colors.blue.hex,
    brightCyan: mocha.colors.flamingo.hex,
    brightGreen: mocha.colors.green.hex,
    brightMagenta: mocha.colors.maroon.hex,
    brightRed: mocha.colors.red.hex,
    brightWhite: mocha.colors.text.hex,
    brightYellow: mocha.colors.yellow.hex,
    cursor: mocha.colors.text.hex,
    cursorAccent: mocha.colors.text.hex,
    cyan: mocha.colors.flamingo.hex,
    foreground: mocha.colors.text.hex,
    green: mocha.colors.green.hex,
    magenta: mocha.colors.maroon.hex,
    red: mocha.colors.red.hex,
    white: mocha.colors.text.hex,
    yellow: mocha.colors.yellow.hex,
  },
};
