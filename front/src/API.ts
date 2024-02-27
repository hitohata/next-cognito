/* tslint:disable */
/* eslint-disable */
//  This file was automatically generated and should not be edited.

export type DemoInput = {
  version: string,
};

export type demo = {
  __typename: "demo",
  id: string,
  version: string,
};

export type AddDemoMutationVariables = {
  input: DemoInput,
};

export type AddDemoMutation = {
  addDemo?:  {
    __typename: "demo",
    id: string,
    version: string,
  } | null,
};

export type GetDemosQueryVariables = {
};

export type GetDemosQuery = {
  getDemos?:  Array< {
    __typename: "demo",
    id: string,
    version: string,
  } > | null,
};
