/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { autobind } from 'core-decorators';
import React from 'react';
import Type from 'prop-types';
import { asYouType as AsYouType } from 'libphonenumber-js';

import FlagIcon from '../flag-icon/flag-icon';
import Input from '../input/input';
import Select from '../select/select';

import cn from '../cn';
import performance from '../performance';

import countries from './countries';

/**
 * Компонент ввода международного телефона по маске.
 *
 * TODO @teryaew:
 * Сделать оптимальную загрузку для libphonenumber-js и спрайта
 * Нарезать спрайты флагов на 2/4? размера
 * Тесты
 *
 * @extends Input
 */
@cn('intl-phone-input', Input)
@performance()
class IntlPhoneInput extends React.Component {
    static propTypes = {
        ...Input.propTypes,
        /** Подсказка в текстовом поле */
        inputPlaceholder: Type.string
    };

    static defaultProps = {
        inputPlaceholder: '+7 000 000 00 00'
    };

    state = {
        countryIso2: 'ru',
        inputFocused: false,
        inputValue: '+7'
    }

    countries;
    input;
    timeoutId;

    componentWillUnmount() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
    }

    render(cn, Input) {
        return (
            <div className={ cn() }>
                <Input
                    className={ cn('input') }
                    ref={ (input) => { this.input = input; } }
                    { ...this.props }
                    focused={ this.state.inputFocused }
                    leftAddons={
                        <Select
                            className={ cn('select') }
                            disabled={ this.props.disabled }
                            mode='radio'
                            options={ this.getOptions(cn) }
                            renderButtonContent={ this.renderSelectButtonContent }
                            size={ this.props.size }
                            value={ [this.state.countryIso2] }
                            onBlur={ this.handleSelectBlur }
                            onChange={ this.handleSelectChange }
                            onFocus={ this.handleSelectFocus }
                        />
                    }
                    noValidate={ true }
                    placeholder={ this.props.inputPlaceholder }
                    type='tel'
                    value={ this.props.value !== undefined ? this.props.value : this.state.inputValue }
                    onBlur={ this.handleInputBlur }
                    onChange={ this.handleInputChange }
                    onFocus={ this.handleInputFocus }
                />
            </div>
        );
    }

    @autobind
    renderSelectButtonContent() {
        return <FlagIcon country={ this.state.countryIso2 } />;
    }

    @autobind
    handleSelectBlur() {
        if (this.input && document.activeElement !== this.input.getControl()) {
            this.setState({ inputFocused: false });
        }
    }

    @autobind
    handleSelectFocus() {
        this.setState({ inputFocused: true });
    }

    @autobind
    handleSelectChange(value) {
        let inputValue = `+${this.countries.find(country => country.iso2 === value[0]).dialCode}`;

        this.setState({
            countryIso2: value[0],
            inputValue
        }, () => {
            // Wait for select blur, then focus on input
            this.timeoutId = setTimeout(() => {
                this.input.focus();
                this.input.setSelectionRange(inputValue.length);
            }, 0);
        });
    }

    @autobind
    handleInputBlur() {
        this.setState({ inputFocused: false });
    }

    @autobind
    handleInputChange(value) {
        this.setState({
            inputValue: value.length === 1 && value !== '+' ? `+${value}` : value
        }, () => {
            let inputValue = this.state.inputValue.replace(/ /g, '');

            this.countries.forEach((country) => {
                if (new RegExp(`^\\+${country.dialCode}`).test(inputValue)) {
                    // TODO @teryaew: rewrite comments below
                    // Если ^+1|7 и ввели больше 2 символов, то выбираем в этом цикле по условию this.state.countryIso2 === country.iso2
                    // Если +1 и ввели меньше 4 символов, то не форматируем, давая возможность перейти на другую локаль
                    // Проверка на равенство country.dialCode и inputValue нужна для переключения с +1 на +1xxx
                    if (/^\+(1|7)/.test(inputValue)) {
                        if (inputValue.length >= 4) {
                            if (new RegExp(`^\\+${country.dialCode}$`).test(inputValue) ||
                                this.state.countryIso2 === country.iso2) {
                                this.setCountry(country, inputValue);
                            }
                        } else if (inputValue.length <= 2 && country.priority === 0) {
                            this.setCountry(country, inputValue);
                        }
                    } else {
                        // Всегда форматируем если не +1
                        this.setCountry(country, inputValue);
                    }
                }
            });
        });
    }

    @autobind
    handleInputFocus() {
        this.setState({ inputFocused: true });
    }

    @autobind
    getOptions(cn) {
        this.countries = countries.getCountries();

        return this.countries.map(country => ({
            value: country.iso2,
            text: (
                <span>
                    { country.name }
                    <span className={ cn('select-option-code') }>+{ country.dialCode }</span>
                </span>
            ),
            icon: (
                <span className={ cn('select-option-flag') }>
                    <FlagIcon country={ country.iso2 } />
                </span>
            )
        }));
    }

    setCountry(country, inputValue) {
        this.setState({
            inputValue: new AsYouType(country.iso2.toUpperCase()).input(inputValue),
            countryIso2: country.iso2
        });
    }

    /**
     * Устанавливает фокус на поле ввода.
     *
     * @public
     */
    focus() {
        this.root.focus();
    }

    /**
     * Убирает фокус с поля ввода.
     *
     * @public
     */
    blur() {
        this.root.blur();
    }

    /**
     * Скроллит страницу до поля ввода.
     *
     * @public
     */
    scrollTo() {
        this.root.scrollTo();
    }
}

export default IntlPhoneInput;
