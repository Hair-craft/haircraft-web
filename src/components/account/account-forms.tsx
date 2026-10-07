"use client";

import Link from "next/link";
import { useActionState, useRef, useState, type FormEvent } from "react";
import { FormError, PasswordField, useFocusFirstProblem } from "@/components/auth/auth-forms";
import { Button, ButtonLink } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Checkbox, Input, Select } from "@/components/ui/fields";
import {
  changePasswordAction,
  deleteAddressAction,
  makeDefaultAddressAction,
  saveAddressAction,
  saveProfileAction,
  type AccountFormState,
} from "@/lib/account/actions";
import {
  INDIAN_STATES,
  LABEL_CHOICES,
  labelChoice,
  localMobile,
  type Address,
} from "@/lib/account/rules";

const EMPTY: AccountFormState = { error: null, fields: {}, values: {} };

/** Name and mobile; the email is shown but can't be changed here. */
export function ProfileForm({
  profile,
}: {
  profile: { email: string; firstName: string; lastName: string | null; phone: string | null };
}) {
  const [state, action, pending] = useActionState(saveProfileAction, EMPTY);
  const form = useFocusFirstProblem(state);
  const value = (name: string, saved: string) => state.values[name] ?? saved;
  return (
    <form ref={form} action={action} noValidate className="flex flex-col gap-5">
      {state.saved ? (
        <p role="status" className="rounded-2xl bg-mint-deep px-4 py-3 text-sm">
          Your details are saved.
        </p>
      ) : null}
      <FormError message={state.error} />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="First name"
          name="firstName"
          autoComplete="given-name"
          required
          maxLength={100}
          defaultValue={value("firstName", profile.firstName)}
          error={state.fields.firstName}
        />
        <Input
          label="Last name"
          name="lastName"
          autoComplete="family-name"
          maxLength={100}
          defaultValue={value("lastName", profile.lastName ?? "")}
          error={state.fields.lastName}
        />
      </div>
      <Input
        label="Mobile number"
        name="phone"
        type="tel"
        autoComplete="tel-national"
        inputMode="tel"
        hint="Optional. For delivery updates, e.g. 98765 43210."
        defaultValue={value("phone", localMobile(profile.phone))}
        error={state.fields.phone}
      />
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-deep">Email</p>
        <p className="rounded-xl border border-deep/10 bg-white/40 px-4 py-2.5 text-deep/80">
          {profile.email}
        </p>
        <p className="text-xs text-deep/70">
          To change your email, please{" "}
          <Link href="/contact" className="underline underline-offset-4 hover:text-deep">
            contact us
          </Link>
          .
        </p>
      </div>
      <div>
        <Button type="submit" loading={pending}>
          Save changes
        </Button>
      </div>
    </form>
  );
}

/** Adding or editing an address. Built to be reused by checkout (S10). */
export function AddressForm({
  address,
  back = "/account/addresses",
  isFirst = false,
  pick = false,
  here,
}: {
  /** The address being edited; none when adding. */
  address?: Address;
  /** Where to go after saving (and Cancel). */
  back?: string;
  /** The first address always becomes the default. */
  isFirst?: boolean;
  /** Checkout: come back to `back` with the new address chosen. */
  pick?: boolean;
  /** This form's own page (to come back to after signing in again). */
  here?: string;
}) {
  const [state, action, pending] = useActionState(saveAddressAction, EMPTY);
  const form = useFocusFirstProblem(state);
  const saved = labelChoice(address?.label ?? null);
  const value = (name: string, fallback: string) => state.values[name] ?? fallback;
  const chosen = value("labelChoice", saved.choice);
  return (
    <form ref={form} action={action} noValidate className="flex flex-col gap-5">
      <FormError message={state.error} />
      {address ? <input type="hidden" name="id" value={address.id} /> : null}
      <input type="hidden" name="back" value={back} />
      {pick ? <input type="hidden" name="pick" value="1" /> : null}
      {here ? <input type="hidden" name="here" value={here} /> : null}
      <fieldset className="group flex flex-col gap-2">
        <legend className="mb-1.5 text-sm font-medium text-deep">Label (optional)</legend>
        <div className="flex flex-wrap gap-2">
          {LABEL_CHOICES.map((choice) => (
            <label
              key={choice}
              className="cursor-pointer rounded-full border border-deep/20 bg-white/70 px-4 py-2 text-sm has-checked:border-deep has-checked:bg-deep has-checked:text-mint has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-deep"
            >
              <input
                type="radio"
                name="labelChoice"
                value={choice}
                defaultChecked={chosen === choice}
                className="sr-only"
              />
              {choice}
            </label>
          ))}
        </div>
        {/* Shown when "Other" is chosen (a CSS rule, so it works without JavaScript). */}
        <div className="hidden group-has-[input[value=Other]:checked]:block">
          <Input
            label="Your label"
            name="labelOther"
            maxLength={30}
            hint="For example: Mum's place."
            defaultValue={value("labelOther", saved.other)}
            error={state.fields.labelOther}
          />
        </div>
      </fieldset>
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Full name"
          name="fullName"
          autoComplete="name"
          required
          maxLength={100}
          defaultValue={value("fullName", address?.fullName ?? "")}
          error={state.fields.fullName}
        />
        <Input
          label="Mobile number"
          name="phone"
          type="tel"
          autoComplete="tel-national"
          inputMode="tel"
          required
          hint="For the courier, e.g. 98765 43210."
          defaultValue={value("phone", localMobile(address?.phone ?? null))}
          error={state.fields.phone}
        />
      </div>
      <Input
        label="Flat, house, building, street"
        name="line1"
        autoComplete="address-line1"
        required
        maxLength={200}
        defaultValue={value("line1", address?.line1 ?? "")}
        error={state.fields.line1}
      />
      <Input
        label="Area, locality (optional)"
        name="line2"
        autoComplete="address-line2"
        maxLength={200}
        defaultValue={value("line2", address?.line2 ?? "")}
        error={state.fields.line2}
      />
      <Input
        label="Landmark (optional)"
        name="landmark"
        maxLength={100}
        hint="For example: near the city library."
        defaultValue={value("landmark", address?.landmark ?? "")}
        error={state.fields.landmark}
      />
      <div className="grid gap-5 sm:grid-cols-3">
        <Input
          label="Town or city"
          name="city"
          autoComplete="address-level2"
          required
          maxLength={100}
          defaultValue={value("city", address?.city ?? "")}
          error={state.fields.city}
        />
        <Select
          key={value("state", address?.state ?? "")}
          label="State"
          name="state"
          autoComplete="address-level1"
          required
          defaultValue={value("state", address?.state ?? "")}
          error={state.fields.state}
          options={[
            { value: "", label: "Choose…" },
            ...INDIAN_STATES.map((name) => ({ value: name, label: name })),
          ]}
        />
        <Input
          label="PIN code"
          name="postalCode"
          autoComplete="postal-code"
          inputMode="numeric"
          required
          maxLength={7}
          defaultValue={value("postalCode", address?.postalCode ?? "")}
          error={state.fields.postalCode}
        />
      </div>
      {address?.isDefault ? (
        <p className="text-sm text-deep/70">This is your default address.</p>
      ) : isFirst ? (
        <p className="text-sm text-deep/70">Your first address becomes your default.</p>
      ) : (
        <Checkbox name="isDefault" label="Make this my default address" />
      )}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" loading={pending}>
          {address ? "Save address" : "Add address"}
        </Button>
        <ButtonLink href={back} variant="ghost">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}

/** Make default and Delete under an address card (Delete asks first). */
export function AddressActions({ address }: { address: Address }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const deleteForm = useRef<HTMLFormElement>(null);
  const name = address.label ?? address.fullName;
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      <Link
        href={`/account/addresses/${address.id}`}
        aria-label={`Edit ${name}`}
        className="font-medium underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-deep"
      >
        Edit
      </Link>
      {address.isDefault ? null : (
        <form action={makeDefaultAddressAction}>
          <input type="hidden" name="id" value={address.id} />
          <button
            type="submit"
            aria-label={`Make ${name} my default address`}
            className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-deep"
          >
            Make default
          </button>
        </form>
      )}
      <form
        action={deleteAddressAction}
        onSubmit={(event: FormEvent) => {
          // With JavaScript, ask first; the dialog's button sends the form.
          if (!confirming) {
            event.preventDefault();
            setConfirming(true);
          }
        }}
        ref={deleteForm}
      >
        <input type="hidden" name="id" value={address.id} />
        <button
          type="submit"
          aria-label={`Delete ${name}`}
          className="text-red-800 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-deep"
        >
          Delete
        </button>
      </form>
      <Dialog open={confirming} onClose={() => setConfirming(false)} title="Delete this address?">
        <p className="text-deep/75">
          {address.fullName}, {address.city}. This can&apos;t be undone.
          {address.isDefault ? " Another saved address becomes your default." : ""}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button
            loading={deleting}
            onClick={() => {
              // Sent before the button shows its spinner (a disabled submit button sends nothing).
              deleteForm.current?.requestSubmit();
              setDeleting(true);
            }}
          >
            Delete address
          </Button>
          <Button type="button" variant="ghost" onClick={() => setConfirming(false)}>
            Keep it
          </Button>
        </div>
      </Dialog>
    </div>
  );
}

/** Change password: this browser stays signed in, every other device is signed out. */
export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, EMPTY);
  const form = useFocusFirstProblem(state);
  return (
    <form ref={form} action={action} noValidate className="flex flex-col gap-5">
      <FormError message={state.error} />
      <PasswordField
        label="Current password"
        name="currentPassword"
        autoComplete="current-password"
        error={state.fields.currentPassword}
      />
      <PasswordField
        label="New password"
        name="newPassword"
        autoComplete="new-password"
        error={state.fields.newPassword}
        showRules
      />
      <PasswordField
        label="Confirm new password"
        name="confirmPassword"
        autoComplete="new-password"
        error={state.fields.confirmPassword}
      />
      <div>
        <Button type="submit" loading={pending}>
          Change password
        </Button>
      </div>
    </form>
  );
}
