import {computed} from "vue";
import {has} from "lodash";

export interface FormFieldProps {
    field?: object,
    modelValue?: string | number | boolean | Array<any>,
    required?: boolean
}

export function useFormField(initialProps: FormFieldProps, emit) {
    const props = {
        required: false,
        ...initialProps
    };

    const isVuelidateField = computed(() => {
        return props.field !== undefined;
    });

    const model = computed({
        get() {
            return (isVuelidateField.value)
                ? props.field.$model
                : props.modelValue;
        },
        set(newValue) {
            if (isVuelidateField.value) {
                props.field.$model = newValue;
            } else {
                emit('update:modelValue', newValue);
            }
        }
    });

    const fieldClass = computed(() => {
        if (!isVuelidateField.value) {
            return null;
        }

        if (!props.field.$dirty) {
            return null;
        }

        return props.field.$error
            ? 'is-invalid'
            : 'is-valid';
    });

    const isRequired = computed(() => {
        if (props.required) {
            return props.required;
        }

        return (isVuelidateField.value)
            ? has(props.field, 'required')
            : false;
    });

    return {
        isVuelidateField,
        model,
        fieldClass,
        isRequired
    }
}
