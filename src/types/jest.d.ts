import '@testing-library/jest-dom';

declare global {
  namespace jest {
    interface Expect {
      toBeInTheDocument(): any;
      toHaveAttribute(attr: string, value?: string): any;
      toHaveClass(className: string): any;
      toHaveStyle(style: Record<string, any>): any;
      toHaveTextContent(text: string | RegExp): any;
      toContainElement(element: HTMLElement | null): any;
      toContainHTML(html: string): any;
      toBeVisible(): any;
      toBeDisabled(): any;
      toBeEnabled(): any;
      toBeChecked(): any;
      toHaveFocus(): any;
      toBeRequired(): any;
      toHaveValue(value: string | string[] | number | null): any;
      toBeInvalid(): any;
      toBeValid(): any;
      toHaveDisplayValue(value: string | RegExp | Array<string | RegExp>): any;
      toBeEmpty(): any;
      toBeEmptyDOMElement(): any;
    }
  }
}
